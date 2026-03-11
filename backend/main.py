from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import pandas as pd
import numpy as np
import io
import json
from database import get_connection, init_db

app = FastAPI(title="XAI Wizard API", version="1.0.0")

# CORS for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
init_db()

# ─── In-memory data store (session-based, per project) ───
_sessions = {}  # project_id -> { df: DataFrame, filename: str }


def get_session(project_id: str):
    if project_id not in _sessions:
        raise HTTPException(status_code=404, detail=f"프로젝트 '{project_id}'에 로드된 데이터가 없습니다.")
    return _sessions[project_id]


def df_to_response(df: pd.DataFrame, filename: str = ""):
    columns = df.columns.tolist()
    types = []
    for c in columns:
        if pd.api.types.is_integer_dtype(df[c]):
            types.append("int")
        elif pd.api.types.is_float_dtype(df[c]):
            types.append("float")
        else:
            types.append("str")
    rows = df.where(df.notna(), None).values.tolist()
    return {"columns": columns, "types": types, "rows": rows, "fileName": filename, "rowCount": len(rows), "colCount": len(columns)}


# ─── Root ───
@app.get("/")
def read_root():
    return {"message": "XAI Wizard 서버가 작동 중입니다!", "version": "1.0.0"}


# ─── Data Upload ───
@app.post("/api/data/upload")
async def upload_data(project_id: str = Form("default"), file: UploadFile = File(...)):
    contents = await file.read()
    filename = file.filename or "uploaded.csv"

    try:
        if filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            # Try UTF-8 first, then cp949 for Korean files
            try:
                df = pd.read_csv(io.BytesIO(contents), encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(contents), encoding="cp949")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"파일 파싱 오류: {str(e)}")

    _sessions[project_id] = {"df": df, "filename": filename}
    return {"status": "success", **df_to_response(df, filename)}


# ─── Get current data ───
@app.get("/api/data/{project_id}")
def get_data(project_id: str):
    session = get_session(project_id)
    return df_to_response(session["df"], session["filename"])


# ─── Preprocessing ───
class PreprocessRequest(BaseModel):
    project_id: str = "default"
    action: str  # delete_columns, missing_value, scaling, encoding, type_conversion, transpose
    columns: Optional[List[str]] = None
    params: Optional[dict] = None


@app.post("/api/preprocess")
def preprocess(req: PreprocessRequest):
    session = get_session(req.project_id)
    df = session["df"].copy()
    cols = req.columns or []
    params = req.params or {}

    try:
        if req.action == "delete_columns":
            df = df.drop(columns=cols, errors="ignore")

        elif req.action == "missing_value":
            method = params.get("method", "drop_row")
            for c in cols:
                if c not in df.columns:
                    continue
                if method == "drop_row":
                    df = df.dropna(subset=[c])
                elif method == "mean":
                    df[c] = df[c].fillna(df[c].mean())
                elif method == "median":
                    df[c] = df[c].fillna(df[c].median())
                elif method == "mode":
                    df[c] = df[c].fillna(df[c].mode().iloc[0] if not df[c].mode().empty else 0)
                elif method == "zero":
                    df[c] = df[c].fillna(0)
                elif method == "custom":
                    df[c] = df[c].fillna(params.get("value", 0))
                elif method == "ffill":
                    df[c] = df[c].ffill()
                elif method == "bfill":
                    df[c] = df[c].bfill()
                elif method == "interpolation":
                    df[c] = df[c].interpolate()
                elif method == "drop_column":
                    df = df.drop(columns=[c])

        elif req.action == "scaling":
            from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, MaxAbsScaler
            scaler_type = params.get("scaler", "standard")
            scalers = {
                "standard": StandardScaler,
                "minmax": MinMaxScaler,
                "robust": RobustScaler,
                "maxabs": MaxAbsScaler,
            }
            valid_cols = [c for c in cols if c in df.columns and pd.api.types.is_numeric_dtype(df[c])]
            if valid_cols:
                if scaler_type in scalers:
                    scaler = scalers[scaler_type]()
                    df[valid_cols] = scaler.fit_transform(df[valid_cols].fillna(0))
                elif scaler_type == "log":
                    for c in valid_cols:
                        df[c] = np.log1p(df[c].clip(lower=0))
                elif scaler_type in ("boxcox", "yeojohnson"):
                    from sklearn.preprocessing import PowerTransformer
                    pt = PowerTransformer(method="yeo-johnson" if scaler_type == "yeojohnson" else "box-cox")
                    try:
                        df[valid_cols] = pt.fit_transform(df[valid_cols].fillna(0))
                    except ValueError:
                        pt = PowerTransformer(method="yeo-johnson")
                        df[valid_cols] = pt.fit_transform(df[valid_cols].fillna(0))

        elif req.action == "encoding":
            enc_type = params.get("encoding", "onehot")
            for c in cols:
                if c not in df.columns:
                    continue
                if enc_type == "onehot":
                    dummies = pd.get_dummies(df[c], prefix=c)
                    df = pd.concat([df.drop(columns=[c]), dummies], axis=1)
                elif enc_type == "label":
                    from sklearn.preprocessing import LabelEncoder
                    le = LabelEncoder()
                    df[c] = le.fit_transform(df[c].astype(str))
                elif enc_type == "ordinal":
                    cats = df[c].unique().tolist()
                    mapping = {v: i for i, v in enumerate(sorted(cats, key=str))}
                    df[c] = df[c].map(mapping)
                elif enc_type == "frequency":
                    freq = df[c].value_counts(normalize=True)
                    df[c] = df[c].map(freq)

        elif req.action == "type_conversion":
            col = cols[0] if cols else None
            target_type = params.get("target_type", "str")
            if col and col in df.columns:
                if target_type == "int":
                    df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")
                elif target_type == "float":
                    df[col] = pd.to_numeric(df[col], errors="coerce")
                elif target_type == "str":
                    df[col] = df[col].astype(str)
                elif target_type == "datetime":
                    fmt = params.get("dateFormat")
                    df[col] = pd.to_datetime(df[col], format=fmt, errors="coerce")
                elif target_type == "bool":
                    df[col] = df[col].astype(bool)
                elif target_type == "category":
                    df[col] = df[col].astype("category")

        elif req.action == "transpose":
            df = df.T.reset_index()
            df.columns = ["Feature"] + [f"Row_{i}" for i in range(len(df.columns) - 1)]

        session["df"] = df
        return {"status": "success", **df_to_response(df, session["filename"])}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Modeling ───
class ModelRequest(BaseModel):
    project_id: str = "default"
    model_type: str  # linear_reg, logistic_reg, dt, kmeans, svm, random_forest, pca, mlr, knn
    target: Optional[str] = None
    features: List[str]
    params: Optional[dict] = None


@app.post("/api/model/train")
def train_model(req: ModelRequest):
    session = get_session(req.project_id)
    df = session["df"].copy()
    params = req.params or {}

    try:
        feature_cols = [c for c in req.features if c in df.columns]
        X = df[feature_cols].apply(pd.to_numeric, errors="coerce").fillna(0).values

        result = {"model_type": req.model_type}

        if req.model_type in ("linear_reg", "mlr"):
            from sklearn.linear_model import LinearRegression
            from sklearn.model_selection import train_test_split
            from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
            y = pd.to_numeric(df[req.target], errors="coerce").fillna(0).values
            split = params.get("split_ratio", 0.2)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=split, random_state=params.get("random_state", 42))
            model = LinearRegression(fit_intercept=params.get("fit_intercept", True))
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            result.update({
                "r2": float(r2_score(y_test, y_pred)),
                "mse": float(mean_squared_error(y_test, y_pred)),
                "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred))),
                "mae": float(mean_absolute_error(y_test, y_pred)),
                "coefficients": {f: float(c) for f, c in zip(feature_cols, model.coef_)},
                "intercept": float(model.intercept_),
                "y_test": y_test.tolist(),
                "y_pred": y_pred.tolist(),
            })

        elif req.model_type == "logistic_reg":
            from sklearn.linear_model import LogisticRegression
            from sklearn.model_selection import train_test_split
            from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
            y = pd.to_numeric(df[req.target], errors="coerce").fillna(0).astype(int).values
            split = params.get("split_ratio", 0.2)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=split, random_state=params.get("random_state", 42))
            model = LogisticRegression(C=params.get("C", 1.0), max_iter=params.get("max_iter", 100), solver=params.get("solver", "lbfgs"))
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            avg = "binary" if len(set(y)) == 2 else "weighted"
            result.update({
                "accuracy": float(accuracy_score(y_test, y_pred)),
                "precision": float(precision_score(y_test, y_pred, average=avg, zero_division=0)),
                "recall": float(recall_score(y_test, y_pred, average=avg, zero_division=0)),
                "f1": float(f1_score(y_test, y_pred, average=avg, zero_division=0)),
                "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
                "labels": sorted(list(set(y_test))),
            })

        elif req.model_type == "dt":
            from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
            from sklearn.model_selection import train_test_split
            task = params.get("task_type", "classification")
            y = pd.to_numeric(df[req.target], errors="coerce").fillna(0).values
            split = params.get("split_ratio", 0.2)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=split, random_state=params.get("random_state", 42))
            if task == "classification":
                y_train, y_test = y_train.astype(int), y_test.astype(int)
                model = DecisionTreeClassifier(max_depth=params.get("max_depth", 5), random_state=params.get("random_state", 42))
            else:
                model = DecisionTreeRegressor(max_depth=params.get("max_depth", 5), random_state=params.get("random_state", 42))
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            imp = {f: float(v) for f, v in zip(feature_cols, model.feature_importances_)}
            if task == "classification":
                from sklearn.metrics import accuracy_score
                result.update({"accuracy": float(accuracy_score(y_test, y_pred)), "feature_importance": imp})
            else:
                from sklearn.metrics import r2_score
                result.update({"r2": float(r2_score(y_test, y_pred)), "feature_importance": imp})

        elif req.model_type == "kmeans":
            from sklearn.cluster import KMeans
            from sklearn.metrics import silhouette_score as sil_score
            k = params.get("k", 3)
            model = KMeans(n_clusters=k, max_iter=params.get("max_iter", 300), n_init=params.get("n_init", 10), random_state=42)
            labels = model.fit_predict(X)
            sil = float(sil_score(X, labels)) if k < len(X) else 0
            result.update({
                "labels": labels.tolist(),
                "centroids": model.cluster_centers_.tolist(),
                "inertia": float(model.inertia_),
                "silhouette": sil,
            })

        elif req.model_type == "random_forest":
            from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
            from sklearn.model_selection import train_test_split
            task = params.get("task_type", "classification")
            y = pd.to_numeric(df[req.target], errors="coerce").fillna(0).values
            split = params.get("split_ratio", 0.2)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=split, random_state=params.get("random_state", 42))
            n_est = params.get("n_estimators", 100)
            md = params.get("max_depth", 5)
            if task == "classification":
                y_train, y_test = y_train.astype(int), y_test.astype(int)
                model = RandomForestClassifier(n_estimators=n_est, max_depth=md, random_state=params.get("random_state", 42))
            else:
                model = RandomForestRegressor(n_estimators=n_est, max_depth=md, random_state=params.get("random_state", 42))
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            imp = {f: float(v) for f, v in zip(feature_cols, model.feature_importances_)}
            if task == "classification":
                from sklearn.metrics import accuracy_score
                result.update({"accuracy": float(accuracy_score(y_test, y_pred)), "feature_importance": imp})
            else:
                from sklearn.metrics import r2_score
                result.update({"r2": float(r2_score(y_test, y_pred)), "feature_importance": imp})

        elif req.model_type == "pca":
            from sklearn.decomposition import PCA
            n_comp = min(params.get("n_components", 2), X.shape[1])
            from sklearn.preprocessing import StandardScaler
            Xs = StandardScaler().fit_transform(X)
            pca = PCA(n_components=n_comp)
            transformed = pca.fit_transform(Xs)
            result.update({
                "explained_variance_ratio": pca.explained_variance_ratio_.tolist(),
                "components": pca.components_.tolist(),
                "transformed": transformed[:, :2].tolist() if n_comp >= 2 else transformed.tolist(),
            })

        elif req.model_type == "knn":
            from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
            from sklearn.model_selection import train_test_split
            task = params.get("task_type", "classification")
            y = pd.to_numeric(df[req.target], errors="coerce").fillna(0).values
            split = params.get("split_ratio", 0.2)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=split, random_state=params.get("random_state", 42))
            k = params.get("k", 5)
            if task == "classification":
                y_train, y_test = y_train.astype(int), y_test.astype(int)
                model = KNeighborsClassifier(n_neighbors=k, weights=params.get("weights", "uniform"))
            else:
                model = KNeighborsRegressor(n_neighbors=k, weights=params.get("weights", "uniform"))
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            if task == "classification":
                from sklearn.metrics import accuracy_score
                result.update({"accuracy": float(accuracy_score(y_test, y_pred))})
            else:
                from sklearn.metrics import r2_score
                result.update({"r2": float(r2_score(y_test, y_pred))})

        elif req.model_type == "svm":
            from sklearn.svm import SVC
            from sklearn.model_selection import train_test_split
            from sklearn.metrics import accuracy_score, confusion_matrix
            y = pd.to_numeric(df[req.target], errors="coerce").fillna(0).astype(int).values
            split = params.get("split_ratio", 0.2)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=split, random_state=params.get("random_state", 42))
            model = SVC(kernel=params.get("kernel", "rbf"), C=params.get("C", 1.0))
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            result.update({
                "accuracy": float(accuracy_score(y_test, y_pred)),
                "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
            })

        result["status"] = "success"
        return result

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Feature Store ───
@app.get("/api/feature-store")
def get_feature_store():
    """Return list of available datasets from DB or mock data"""
    return {
        "datasets": [
            {"id": "fs1", "name": "수리부속_수요실적_5개년", "rows": 125000, "cols": 15, "updated": "2024-01-15"},
            {"id": "fs2", "name": "장비_가동현황", "rows": 45000, "cols": 12, "updated": "2024-01-20"},
            {"id": "fs3", "name": "자재_재고현황", "rows": 32000, "cols": 10, "updated": "2024-01-22"},
            {"id": "fs4", "name": "고객_이탈예측_학습데이터", "rows": 85000, "cols": 18, "updated": "2024-01-18"},
            {"id": "fs5", "name": "센서_측정데이터_2024", "rows": 500000, "cols": 14, "updated": "2024-01-23"},
        ]
    }


# ─── DB Save ───
@app.post("/api/data/save")
async def save_to_db(project_id: str = Form("default")):
    session = get_session(project_id)
    df = session["df"]
    table_name = f"TB_{project_id.replace(' ', '_').upper()}"

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
        cols = df.columns.tolist()
        mapping = {f"A{i+1}": col for i, col in enumerate(cols)}
        cols_sql = ", ".join([f"{cid} TEXT" for cid in mapping.keys()])
        cursor.execute(f"CREATE TABLE {table_name} ({cols_sql})")

        # Clear old mapping
        cursor.execute("DELETE FROM TB_COLUMN_MAP WHERE PROJECT_ID = ?", (project_id,))
        for cid, orig in mapping.items():
            cursor.execute("INSERT INTO TB_COLUMN_MAP (PROJECT_ID, PHYSICAL_COL_NM, LOGICAL_COL_NM) VALUES (?, ?, ?)",
                           (project_id, cid, orig))

        data_tuples = [tuple(str(x) if pd.notna(x) else None for x in row) for row in df.values]
        placeholders = ", ".join(["?" for _ in mapping])
        cursor.executemany(f"INSERT INTO {table_name} VALUES ({placeholders})", data_tuples)
        conn.commit()
        return {"status": "success", "table_name": table_name, "rows": len(data_tuples)}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
