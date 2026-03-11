import React from 'react';
import DeleteColumnControl from '../controls/preprocessing/DeleteColumnControl';
import MissingValueControl from '../controls/preprocessing/MissingValueControl';
import ScalingControl from '../controls/preprocessing/ScalingControl';
import EncodingControl from '../controls/preprocessing/EncodingControl';
import TypeConversionControl from '../controls/preprocessing/TypeConversionControl';
import TransposeControl from '../controls/preprocessing/TransposeControl';
import StatisticsControl from '../controls/eda/StatisticsControl';
import LineChartControl from '../controls/eda/LineChartControl';
import HistogramControl from '../controls/eda/HistogramControl';
import PieChartControl from '../controls/eda/PieChartControl';
import BarChartControl from '../controls/eda/BarChartControl';
import ScatterControl from '../controls/eda/ScatterControl';
import BoxplotControl from '../controls/eda/BoxplotControl';
import CorrelationControl from '../controls/eda/CorrelationControl';
import LinearRegControl from '../controls/modeling/LinearRegControl';
import LogisticRegControl from '../controls/modeling/LogisticRegControl';
import DecisionTreeControl from '../controls/modeling/DecisionTreeControl';
import KMeansControl from '../controls/modeling/KMeansControl';
import SVMControl from '../controls/modeling/SVMControl';
import RandomForestControl from '../controls/modeling/RandomForestControl';
import PCAControl from '../controls/modeling/PCAControl';
import MLRControl from '../controls/modeling/MLRControl';
import KNNControl from '../controls/modeling/KNNControl';

const CONTROL_MAP = {
  // Preprocessing
  delete_column: { title: '컬럼 삭제', Component: DeleteColumnControl },
  missing_value: { title: '결측치 처리', Component: MissingValueControl },
  scaling: { title: '스케일링', Component: ScalingControl },
  encoding: { title: '인코딩', Component: EncodingControl },
  data_type_conversion: { title: '데이터 형변환', Component: TypeConversionControl },
  matrix_transpose: { title: '행렬 전치', Component: TransposeControl },
  // EDA
  statistics: { title: '기술 통계', Component: StatisticsControl },
  line_chart: { title: '꺾은선 차트', Component: LineChartControl },
  histogram: { title: '히스토그램', Component: HistogramControl },
  pie_chart: { title: '파이 차트', Component: PieChartControl },
  bar_chart: { title: '막대 차트', Component: BarChartControl },
  scatter_plot: { title: '산포 차트', Component: ScatterControl },
  boxplot: { title: '박스플롯', Component: BoxplotControl },
  correlation: { title: '상관분석', Component: CorrelationControl },
  // Modeling
  linear_reg: { title: 'Linear Regression', Component: LinearRegControl },
  logistic_reg: { title: 'Logistic Regression', Component: LogisticRegControl },
  dt: { title: 'Decision Tree', Component: DecisionTreeControl },
  kmeans: { title: 'K-means', Component: KMeansControl },
  svm: { title: 'SVM', Component: SVMControl },
  random_forest: { title: 'Random Forest', Component: RandomForestControl },
  pca: { title: 'PCA', Component: PCAControl },
  mlr: { title: 'MLR (다중선형회귀)', Component: MLRControl },
  knn: { title: 'KNN', Component: KNNControl },
};

export default function ControlPanel({ selectedFunction }) {
  const entry = selectedFunction ? CONTROL_MAP[selectedFunction] : null;

  return (
    <div className="control-panel">
      <div className="control-header">
        <span>{entry ? `⚙️ ${entry.title}` : '⚙️ 설정'}</span>
      </div>
      <div className="control-body">
        {entry
          ? <entry.Component />
          : <div className="empty-state">좌측에서 기능을 선택하거나<br/>데이터를 로드하세요.</div>
        }
      </div>
    </div>
  );
}
