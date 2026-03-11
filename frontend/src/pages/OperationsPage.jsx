import React, { useEffect, useMemo, useState } from 'react';
import { getFeatureStore } from '../utils/api';
import usePopupWindow from '../hooks/usePopupWindow';

const MODELS_PER_PAGE = 5;

const MODELS = [
  {
    id: 'M001',
    name: '수요예측_LinearReg_v3',
    taskType: '예측',
    type: '선형 회귀 (Linear Regression)',
    status: 'deployed',
    created: '2024-01-15',
    schedule: '매일 09:00',
    lastRun: '2024-01-23 09:00',
    nextRun: '2024-01-24 09:00',
    lastResult: '성공 (Success)',
    owner: '운영분석팀',
    endpoint: '/api/predict/demand',
    metrics: [
      { label: '결정계수 (R2)', value: '0.847', helper: '설명력 기준' },
      { label: '평균제곱근오차 (RMSE)', value: '12.4', helper: '오차의 표준 크기' },
      { label: '평균절대오차 (MAE)', value: '8.1', helper: '평균 절대 오차' },
      { label: '평균절대백분율오차 (MAPE)', value: '6.8%', helper: '백분율 오차 기준' },
    ],
    sourceIndexes: [0, 1],
    fallbackSources: [
      { category: '데이터 저장소', table: 'A_주문이력', detail: '최근 12개월 주문·매출 집계 테이블' },
      { category: '데이터 저장소', table: 'A_프로모션계획', detail: '월별 행사 일정 및 프로모션 반영 테이블' },
    ],
    fallbackNote: '데이터 저장소의 A_주문이력과 A_프로모션계획을 조합해 수요예측 모델을 만들었습니다.',
  },
  {
    id: 'M002',
    name: '이탈예측_RF_v2',
    taskType: '분류',
    type: '랜덤 포레스트 (Random Forest)',
    status: 'deployed',
    created: '2024-01-10',
    schedule: '매주 월요일 06:00',
    lastRun: '2024-01-22 06:00',
    nextRun: '2024-01-29 06:00',
    lastResult: '성공 (Success)',
    owner: 'CRM 운영팀',
    endpoint: '/api/predict/churn',
    metrics: [
      { label: '정확도 (Accuracy)', value: '0.912', helper: '전체 예측 정확도' },
      { label: '정밀도 (Precision)', value: '0.901', helper: '양성 예측 정밀도' },
      { label: '재현율 (Recall)', value: '0.887', helper: '실제 이탈 탐지율' },
      { label: 'F1 점수 (F1-Score)', value: '0.894', helper: '정밀도-재현율 균형' },
    ],
    sourceIndexes: [2, 3],
    fallbackSources: [
      { category: '데이터 저장소', table: 'A_고객활동로그', detail: '최근 방문, 구매, 상담 이력을 집계한 테이블' },
      { category: '데이터 저장소', table: 'A_캠페인반응이력', detail: '캠페인 반응 및 전환 이력 테이블' },
    ],
    fallbackNote: '데이터 저장소의 A_고객활동로그와 A_캠페인반응이력을 기준으로 이탈 가능성을 계산합니다.',
  },
  {
    id: 'M003',
    name: '불량분류_DT_v1',
    taskType: '분류',
    type: '의사결정나무 (Decision Tree)',
    status: 'stopped',
    created: '2024-01-05',
    schedule: '-',
    lastRun: '2024-01-20 12:00',
    nextRun: '-',
    lastResult: '실패 (Fail)',
    owner: '품질혁신팀',
    endpoint: '/api/predict/defect',
    metrics: [
      { label: '정확도 (Accuracy)', value: '0.783', helper: '전체 분류 정확도' },
      { label: '정밀도 (Precision)', value: '0.761', helper: '불량 판정 정밀도' },
      { label: '재현율 (Recall)', value: '0.734', helper: '실제 불량 탐지율' },
      { label: 'F1 점수 (F1-Score)', value: '0.747', helper: '분류 균형 지표' },
    ],
    sourceIndexes: [4],
    fallbackSources: [
      { category: '데이터 저장소', table: 'A_설비센서요약', detail: '설비 센서값과 라인별 품질 결과를 요약한 테이블' },
      { category: '데이터 저장소', table: 'A_품질판정기준', detail: '공정별 품질 판정 기준 테이블' },
    ],
    fallbackNote: '데이터 저장소의 A_설비센서요약과 A_품질판정기준을 바탕으로 불량 여부를 분류합니다.',
  },
  {
    id: 'M004',
    name: '재고예측_XGBoost_v1',
    taskType: '예측',
    type: '그래디언트 부스팅 (Gradient Boosting)',
    status: 'deployed',
    created: '2024-01-12',
    schedule: '매일 18:00',
    lastRun: '2024-01-23 18:00',
    nextRun: '2024-01-24 18:00',
    lastResult: '성공 (Success)',
    owner: 'SCM 운영팀',
    endpoint: '/api/predict/inventory',
    metrics: [
      { label: '결정계수 (R2)', value: '0.871', helper: '설명력 기준' },
      { label: '평균제곱근오차 (RMSE)', value: '9.8', helper: '오차의 표준 크기' },
      { label: '평균절대오차 (MAE)', value: '6.2', helper: '평균 절대 오차' },
      { label: '대칭평균절대백분율오차 (SMAPE)', value: '5.9%', helper: '대칭 백분율 오차' },
    ],
    sourceIndexes: [1, 2],
    fallbackSources: [
      { category: '데이터 저장소', table: 'A_재고회전', detail: '품목별 재고 회전율 및 출고량 테이블' },
      { category: '데이터 저장소', table: 'A_입고계획', detail: '주간 입고 계획 및 안전재고 기준 테이블' },
    ],
    fallbackNote: '데이터 저장소의 A_재고회전과 A_입고계획을 조합해 재고 예측 모델을 만들었습니다.',
  },
  {
    id: 'M005',
    name: '고객세그먼트_KMeans_v2',
    taskType: '분류',
    type: 'K-평균 군집화 (K-Means)',
    status: 'testing',
    created: '2024-01-18',
    schedule: '매주 수요일 03:00',
    lastRun: '2024-01-17 03:00',
    nextRun: '2024-01-24 03:00',
    lastResult: '성공 (Success)',
    owner: '고객전략팀',
    endpoint: '/api/cluster/customer',
    metrics: [
      { label: '실루엣 점수 (Silhouette Score)', value: '0.642', helper: '군집 분리도' },
      { label: '관성 (Inertia)', value: '128.4', helper: '군집 내 거리 합' },
      { label: '군집 수 (Clusters)', value: '5', helper: '현재 최적 군집 수' },
      { label: '데이비스-볼딘 지수 (Davies-Bouldin)', value: '0.71', helper: '군집 간 분리 품질' },
    ],
    sourceIndexes: [3, 4],
    fallbackSources: [
      { category: '데이터 저장소', table: 'A_고객행동요약', detail: '구매 빈도와 객단가를 요약한 테이블' },
      { category: '데이터 저장소', table: 'A_세그먼트전략', detail: '세그먼트 분류 기준 및 타깃 전략 테이블' },
    ],
    fallbackNote: '데이터 저장소의 A_고객행동요약과 A_세그먼트전략을 바탕으로 고객 군집을 운영하고 있습니다.',
  },  {
    id: 'M006',
    name: '설비고장예측_LSTM_v1',
    taskType: '예측',
    type: '장단기 메모리 네트워크 (LSTM)',
    status: 'deployed',
    created: '2024-01-09',
    schedule: '매일 02:00',
    lastRun: '2024-01-23 02:00',
    nextRun: '2024-01-24 02:00',
    lastResult: '성공 (Success)',
    owner: '설비운영팀',
    endpoint: '/api/predict/failure-time',
    metrics: [
      { label: '결정계수 (R2)', value: '0.828', helper: '설명력 기준' },
      { label: '평균제곱근오차 (RMSE)', value: '5.6', helper: '오차의 표준 크기' },
      { label: '평균절대오차 (MAE)', value: '3.9', helper: '평균 절대 오차' },
      { label: '평균절대백분율오차 (MAPE)', value: '4.7%', helper: '백분율 오차 기준' },
    ],
    sourceIndexes: [4],
    fallbackSources: [
      { category: '데이터 저장소', table: 'A_센서시계열', detail: '설비 상태 시계열 센서 테이블' },
      { category: '데이터 저장소', table: 'A_정비이력', detail: '설비 정비 이력 및 점검 결과 테이블' },
    ],
    fallbackNote: '데이터 저장소의 A_센서시계열과 A_정비이력을 기반으로 고장 시점을 예측합니다.',
  },
  {
    id: 'M007',
    name: '문의분류_BERT_v4',
    taskType: '분류',
    type: '버트 (BERT)',
    status: 'deployed',
    created: '2024-01-11',
    schedule: '매일 11:30',
    lastRun: '2024-01-23 11:30',
    nextRun: '2024-01-24 11:30',
    lastResult: '성공 (Success)',
    owner: 'CX혁신팀',
    endpoint: '/api/classify/inquiry',
    metrics: [
      { label: '정확도 (Accuracy)', value: '0.934', helper: '전체 분류 정확도' },
      { label: '정밀도 (Precision)', value: '0.928', helper: '카테고리 분류 정밀도' },
      { label: '재현율 (Recall)', value: '0.921', helper: '실제 카테고리 탐지율' },
      { label: 'F1 점수 (F1-Score)', value: '0.924', helper: '텍스트 분류 균형 지표' },
    ],
    sourceIndexes: [3],
    fallbackSources: [
      { category: '데이터 저장소', table: 'A_문의이력', detail: '고객 문의 텍스트와 상담 결과 테이블' },
      { category: '데이터 저장소', table: 'A_카테고리정의', detail: '문의 분류 기준 및 카테고리 정의 테이블' },
    ],
    fallbackNote: '데이터 저장소의 A_문의이력과 A_카테고리정의를 활용해 문의를 자동 분류합니다.',
  },
  {
    id: 'M008',
    name: '수율예측_CatBoost_v2',
    taskType: '예측',
    type: '캣부스트 (CatBoost)',
    status: 'testing',
    created: '2024-01-19',
    schedule: '매일 21:00',
    lastRun: '2024-01-22 21:00',
    nextRun: '2024-01-23 21:00',
    lastResult: '성공 (Success)',
    owner: '생산기술팀',
    endpoint: '/api/predict/yield',
    metrics: [
      { label: '결정계수 (R2)', value: '0.802', helper: '설명력 기준' },
      { label: '평균제곱근오차 (RMSE)', value: '4.3', helper: '오차의 표준 크기' },
      { label: '평균절대오차 (MAE)', value: '2.8', helper: '평균 절대 오차' },
      { label: '대칭평균절대백분율오차 (SMAPE)', value: '3.6%', helper: '대칭 백분율 오차' },
    ],
    sourceIndexes: [0, 4],
    fallbackSources: [
      { category: '데이터 저장소', table: 'A_공정조건요약', detail: '공정별 파라미터와 생산 결과 테이블' },
      { category: '데이터 저장소', table: 'A_레시피변경이력', detail: '레시피 변경 이력 및 생산 조건 테이블' },
    ],
    fallbackNote: '데이터 저장소의 A_공정조건요약과 A_레시피변경이력을 기준으로 수율을 예측합니다.',
  },
  {
    id: 'M009',
    name: '사기탐지_XGBClassifier_v3',
    taskType: '분류',
    type: '그래디언트 부스팅 분류기 (XGBoost Classifier)',
    status: 'deployed',
    created: '2024-01-07',
    schedule: '매시간',
    lastRun: '2024-01-23 10:00',
    nextRun: '2024-01-23 11:00',
    lastResult: '성공 (Success)',
    owner: '리스크관리팀',
    endpoint: '/api/classify/fraud',
    metrics: [
      { label: '정확도 (Accuracy)', value: '0.948', helper: '전체 분류 정확도' },
      { label: '정밀도 (Precision)', value: '0.913', helper: '사기 탐지 정밀도' },
      { label: '재현율 (Recall)', value: '0.902', helper: '실제 사기 탐지율' },
      { label: 'F1 점수 (F1-Score)', value: '0.907', helper: '리스크 탐지 균형 지표' },
    ],
    sourceIndexes: [2, 3],
    fallbackSources: [
      { category: '데이터 저장소', table: 'A_거래로그', detail: '실시간 거래 이벤트와 리스크 점수 테이블' },
      { category: '데이터 저장소', table: 'A_차단룰셋', detail: '탐지 룰셋 및 이상 거래 패턴 기준 테이블' },
    ],
    fallbackNote: '데이터 저장소의 A_거래로그와 A_차단룰셋을 기준으로 사기 거래를 분류합니다.',
  },
  {
    id: 'M010',
    name: '배송지연예측_LightGBM_v2',
    taskType: '예측',
    type: '라이트GBM (LightGBM)',
    status: 'stopped',
    created: '2024-01-03',
    schedule: '매일 05:00',
    lastRun: '2024-01-20 05:00',
    nextRun: '-',
    lastResult: '실패 (Fail)',
    owner: '물류운영팀',
    endpoint: '/api/predict/delay',
    metrics: [
      { label: '결정계수 (R2)', value: '0.774', helper: '설명력 기준' },
      { label: '평균제곱근오차 (RMSE)', value: '7.1', helper: '오차의 표준 크기' },
      { label: '평균절대오차 (MAE)', value: '4.9', helper: '평균 절대 오차' },
      { label: '평균절대백분율오차 (MAPE)', value: '7.4%', helper: '백분율 오차 기준' },
    ],
    sourceIndexes: [1, 2],
    fallbackSources: [
      { category: '데이터 저장소', table: 'A_배송이력', detail: '배송 리드타임과 지연 사유 테이블' },
      { category: '데이터 저장소', table: 'A_운송제약', detail: '지역별 배송 제약 조건 및 SLA 기준 테이블' },
    ],
    fallbackNote: '데이터 저장소의 A_배송이력과 A_운송제약을 기반으로 배송 지연을 예측합니다.',
  },
];

const STATUS_META = {
  deployed: { text: '운영 중', background: '#d4edda', color: '#155724', border: '#b8dfc2' },
  stopped: { text: '중지', background: '#f8d7da', color: '#721c24', border: '#efb9c0' },
  testing: { text: '테스트', background: '#fff3cd', color: '#856404', border: '#f2dfa0' },
};

const TASK_META = {
  분류: { background: '#eaf6ff', color: '#1f5f8b', border: '#c6e2f7' },
  예측: { background: '#f3ecff', color: '#6a3dad', border: '#dcccf7' },
};

const RESULT_META = {
  success: { background: '#eaf7ee', color: '#1f8f55', border: '#b8e3ca' },
  fail: { background: '#fff0ef', color: '#d14b3f', border: '#f2c2bd' },
};

const METRIC_TONE_META = {
  good: { text: '좋음', background: '#eaf7ee', color: '#1f8f55', border: '#b8e3ca' },
  caution: { text: '주의', background: '#fff4e8', color: '#b35b00', border: '#f1d3ae' },
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getResultTone(lastResult) {
  return lastResult.includes('실패') || lastResult.includes('Fail') ? RESULT_META.fail : RESULT_META.success;
}

function getScheduleResultLabel(lastResult) {
  return lastResult.includes('실패') || lastResult.includes('Fail')
    ? '스케쥴링 실패 (Scheduling Fail)'
    : '스케쥴링 성공 (Scheduling Success)';
}

function getMetricNumericValue(metricValue) {
  return Number.parseFloat(String(metricValue).replace(/,/g, '').replace('%', ''));
}function getMetricTone(metric) {
  const label = metric.label.toLowerCase();
  const value = getMetricNumericValue(metric.value);

  if (Number.isNaN(value)) {
    return METRIC_TONE_META.caution;
  }

  if (
    label.includes('accuracy') ||
    label.includes('precision') ||
    label.includes('recall') ||
    label.includes('f1') ||
    label.includes('r2') ||
    label.includes('silhouette')
  ) {
    return value >= 0.8 ? METRIC_TONE_META.good : METRIC_TONE_META.caution;
  }

  if (label.includes('rmse')) {
    return value <= 10 ? METRIC_TONE_META.good : METRIC_TONE_META.caution;
  }

  if (label.includes('mae')) {
    return value <= 7 ? METRIC_TONE_META.good : METRIC_TONE_META.caution;
  }

  if (label.includes('mape') || label.includes('smape')) {
    return value <= 10 ? METRIC_TONE_META.good : METRIC_TONE_META.caution;
  }

  if (label.includes('davies-bouldin')) {
    return value <= 1 ? METRIC_TONE_META.good : METRIC_TONE_META.caution;
  }

  if (label.includes('inertia')) {
    return value <= 150 ? METRIC_TONE_META.good : METRIC_TONE_META.caution;
  }

  if (label.includes('clusters')) {
    return value >= 3 && value <= 8 ? METRIC_TONE_META.good : METRIC_TONE_META.caution;
  }

  return METRIC_TONE_META.caution;
}

function buildDataSources(model, datasets) {
  const featureSources = (model.sourceIndexes || [])
    .map((index) => datasets[index])
    .filter(Boolean)
    .map((dataset) => ({
      category: '데이터 저장소',
      table: dataset.name,
      detail: `${dataset.rows?.toLocaleString?.() ?? dataset.rows ?? '-'} rows · ${dataset.cols ?? '-'} cols · 최근 갱신 ${dataset.updated ?? '-'}`,
    }));

  return featureSources.length > 0 ? featureSources : model.fallbackSources;
}

function buildDataNote(model, resolvedSources, hasLiveFeatureData) {
  if (!hasLiveFeatureData) {
    return model.fallbackNote;
  }

  const sourceNames = resolvedSources.map((source) => source.table).join(', ');
  return `현재 연결된 실제 데이터 저장소 기준 출처는 ${sourceNames} 입니다. 모델-테이블 직접 매핑 정보가 아직 없어, 운영소에서는 저장소 목록을 기준으로 보여주고 있습니다.`;
}

function buildPopupHtml(model, sources, note, sourceStatus) {
  const taskMeta = TASK_META[model.taskType] || TASK_META.예측;
  const resultTone = getResultTone(model.lastResult);
  const scheduleResultLabel = getScheduleResultLabel(model.lastResult);
  const metricsHtml = model.metrics
    .map((item) => {
      const tone = getMetricTone(item);

      return `
        <div style="background:#f8fafc;border:1px solid #d8e2ec;border-radius:8px;padding:16px;">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;">
            <div style="font-size:12px;font-weight:700;color:#6b7c93;line-height:1.5;">${escapeHtml(item.label)}</div>
            <span style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;background:${tone.background};color:${tone.color};border:1px solid ${tone.border};white-space:nowrap;">${escapeHtml(tone.text)}</span>
          </div>
          <div style="font-size:24px;font-weight:700;color:#2c3e50;">${escapeHtml(item.value)}</div>
          <div style="margin-top:6px;font-size:12px;color:#7f8c8d;">${escapeHtml(item.helper)}</div>
        </div>
      `;
    })
    .join('');

  const sourceRows = sources
    .map(
      (source) => `
        <div style="display:grid;grid-template-columns:110px 1fr;gap:12px;align-items:start;padding:12px 14px;border-radius:8px;background:#f8fbfd;border:1px solid #e1e8ef;">
          <span style="font-size:12px;font-weight:700;color:#3498db;">${escapeHtml(source.category)}</span>
          <div>
            <div style="font-weight:700;color:#2c3e50;margin-bottom:4px;">${escapeHtml(source.table)}</div>
            <div style="font-size:.86rem;color:#6b7c93;line-height:1.5;">${escapeHtml(source.detail)}</div>
          </div>
        </div>
      `
    )
    .join('');

  const statusBlock = sourceStatus.loading
    ? '<div class="note">실제 데이터 저장소 정보를 불러오는 중입니다.</div>'
    : sourceStatus.error
      ? `<div class="owarn">${escapeHtml(sourceStatus.error)}</div>`
      : '';

  return `
    <div style="background:linear-gradient(135deg,#2c3e50 0%,#355c7d 58%,#457b9d 100%);color:#fff;padding:18px 22px;border-radius:12px 12px 0 0;margin:-28px -28px 20px -28px;">
      <div style="font-size:12px;color:#d2deea;margin-bottom:6px;">${escapeHtml(model.id)}</div>
      <h2 style="margin:0;font-size:1.35rem;color:#fff;border-bottom:none;padding-bottom:0;">${escapeHtml(model.name)}</h2>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;background:${taskMeta.background};color:${taskMeta.color};border:1px solid ${taskMeta.border};">${escapeHtml(model.taskType)}</span>
        <span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;background:${resultTone.background};color:${resultTone.color};border:1px solid ${resultTone.border};">${escapeHtml(scheduleResultLabel)}</span>
      </div>
      <div style="margin-top:10px;font-size:.92rem;color:#e1ebf4;line-height:1.7;">알고리즘 ${escapeHtml(model.type)}<br/>모델 생성일 ${escapeHtml(model.created)} | 최근 실행일 ${escapeHtml(model.lastRun)} | 다음 실행일 ${escapeHtml(model.nextRun)}</div>
    </div>

    <div style="background:#fff;border:1px solid #d9e2ec;border-radius:10px;overflow:hidden;margin-bottom:16px;">
      <div style="padding:12px 16px;border-bottom:1px solid #e6edf5;font-weight:700;color:#2c3e50;background:#f8fafc;">운영 요약</div>
      <div style="padding:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">${metricsHtml}</div>
    </div>

    <div style="background:#fff;border:1px solid #d9e2ec;border-radius:10px;overflow:hidden;">
      <div style="padding:12px 16px;border-bottom:1px solid #e6edf5;font-weight:700;color:#2c3e50;background:#f8fafc;">데이터 출처</div>
      <div style="padding:16px;display:grid;gap:10px;">
        ${statusBlock}
        ${sourceRows}
        <div class="note">${escapeHtml(note)}</div>
      </div>
    </div>
  `;
}

export default function OperationsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastOpenedId, setLastOpenedId] = useState(null);
  const [featureDatasets, setFeatureDatasets] = useState([]);
  const [sourceStatus, setSourceStatus] = useState({ loading: true, error: '' });
  const { openPopup } = usePopupWindow();

  useEffect(() => {
    let cancelled = false;

    async function loadSources() {
      setSourceStatus({ loading: true, error: '' });

      try {
        const featureStoreResult = await getFeatureStore();

        if (cancelled) {
          return;
        }

        const datasets = featureStoreResult?.datasets ?? [];

        setFeatureDatasets(datasets);
        setSourceStatus({
          loading: false,
          error: datasets.length === 0 ? '실제 데이터 저장소 정보를 아직 불러오지 못해 예시 데이터를 표시하고 있습니다.' : '',
        });
      } catch (error) {
        if (!cancelled) {
          setFeatureDatasets([]);
          setSourceStatus({
            loading: false,
            error: '실제 데이터 저장소를 불러오지 못해 예시 데이터를 표시하고 있습니다.',
          });
        }
      }
    }

    loadSources();

    return () => {
      cancelled = true;
    };
  }, []);  const ownerOptions = useMemo(
    () => Array.from(new Set(MODELS.map((model) => model.owner))),
    [],
  );

  const filtered = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return MODELS.filter((model) => {
      const matchesStatus = statusFilter === 'all' || model.status === statusFilter;
      const matchesTask = taskFilter === 'all' || model.taskType === taskFilter;
      const matchesOwner = ownerFilter === 'all' || model.owner === ownerFilter;
      const searchTarget = `${model.name} ${model.id} ${model.type} ${model.owner}`.toLowerCase();
      const matchesSearch = keyword.length === 0 || searchTarget.includes(keyword);

      return matchesStatus && matchesTask && matchesOwner && matchesSearch;
    });
  }, [ownerFilter, searchTerm, statusFilter, taskFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / MODELS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, taskFilter, ownerFilter, searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedModels = filtered.slice((currentPage - 1) * MODELS_PER_PAGE, currentPage * MODELS_PER_PAGE);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  const counts = {
    all: MODELS.length,
    deployed: MODELS.filter((model) => model.status === 'deployed').length,
    stopped: MODELS.filter((model) => model.status === 'stopped').length,
    testing: MODELS.filter((model) => model.status === 'testing').length,
  };

  const handleOpenDetail = (model) => {
    const resolvedSources = buildDataSources(model, featureDatasets);
    const resolvedNote = buildDataNote(model, resolvedSources, featureDatasets.length > 0);
    const html = buildPopupHtml(model, resolvedSources, resolvedNote, sourceStatus);

    setLastOpenedId(model.id);
    openPopup(`${model.name} 상세보기`, html, 980, 760);
  };

  return (
    <div className="page-container" style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <section
        style={{
          background: 'linear-gradient(135deg, #2c3e50 0%, #355c7d 58%, #3f6f94 100%)',
          color: '#fff',
          borderRadius: 12,
          padding: '22px 24px',
          boxShadow: '0 8px 24px rgba(44, 62, 80, 0.18)',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.08em', color: '#d2deea', marginBottom: 8 }}>OPERATIONS WORKSPACE</div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#fff' }}>AI 운영소</h1>
            <p style={{ margin: '10px 0 0', color: '#e1ebf4', fontSize: '.95rem', lineHeight: 1.6, maxWidth: 760 }}>
              AI 제작소의 작업형 레이아웃을 가져오되, 운영 화면답게 은은한 그라데이션과 정리된 패널 구조로 다듬었습니다.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))', gap: 10, minWidth: 280 }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, color: '#d2deea', marginBottom: 4 }}>전체 모델</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{counts.all}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, color: '#d2deea', marginBottom: 4 }}>운영 중</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{counts.deployed}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, color: '#d2deea', marginBottom: 4 }}>중지</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{counts.stopped}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, color: '#d2deea', marginBottom: 4 }}>테스트</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{counts.testing}</div>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          background: '#ffffff',
          border: '1px solid #dfe6ee',
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #34495e 0%, #3d5b78 100%)',
            color: '#fff',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontWeight: 700 }}>운영 모델 목록</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              ['all', '전체'],
              ['deployed', '운영 중'],
              ['stopped', '중지'],
              ['testing', '테스트'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.22)',
                  background: statusFilter === value ? '#3498db' : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '.82rem',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: 10, background: '#edf2f7', borderBottom: '1px solid #dde5ed' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10 }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="모델명, ID, 유형, 담당자 검색"
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: 10,
                border: '1px solid #c9d3df',
                background: '#fff',
                color: '#2c3e50',
                fontSize: '.95rem',
                outline: 'none',
              }}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: 10,
                border: '1px solid #c9d3df',
                background: '#fff',
                color: '#2c3e50',
                fontSize: '.95rem',
                outline: 'none',
              }}
            >
              <option value="all">상태: 전체</option>
              <option value="deployed">상태: 운영 중</option>
              <option value="testing">상태: 테스트</option>
              <option value="stopped">상태: 중지</option>
            </select>

            <select
              value={taskFilter}
              onChange={(event) => setTaskFilter(event.target.value)}
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: 10,
                border: '1px solid #c9d3df',
                background: '#fff',
                color: '#2c3e50',
                fontSize: '.95rem',
                outline: 'none',
              }}
            >
              <option value="all">유형: 전체</option>
              <option value="분류">유형: 분류</option>
              <option value="예측">유형: 예측</option>
            </select>

            <select
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: 10,
                border: '1px solid #c9d3df',
                background: '#fff',
                color: '#2c3e50',
                fontSize: '.95rem',
                outline: 'none',
              }}
            >
              <option value="all">담당자: 전체</option>
              {ownerOptions.map((owner) => (
                <option key={owner} value={owner}>{`담당자: ${owner}`}</option>
              ))}
            </select>
          </div>
        </div>        <div style={{ padding: 18, display: 'grid', gap: 14, background: '#edf2f7' }}>
          {pagedModels.map((model) => {
            const status = STATUS_META[model.status];
            const taskMeta = TASK_META[model.taskType] || TASK_META.예측;
            const metricTone = getMetricTone(model.metrics[0]);
            const isOpened = lastOpenedId === model.id;

            return (
              <div
                key={model.id}
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  padding: '18px 20px',
                  border: `1px solid ${isOpened ? '#3498db' : '#dde5ed'}`,
                  boxShadow: isOpened ? '0 0 0 3px rgba(52, 152, 219, 0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#2c3e50' }}>{model.name}</span>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: '.8rem',
                          fontWeight: 700,
                          background: status.background,
                          color: status.color,
                          border: `1px solid ${status.border}`,
                        }}
                      >
                        {status.text}
                      </span>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: '.8rem',
                          fontWeight: 700,
                          background: taskMeta.background,
                          color: taskMeta.color,
                          border: `1px solid ${taskMeta.border}`,
                        }}
                      >
                        {model.taskType}
                      </span>
                      <span style={{ color: '#6b7c93', fontSize: '.82rem', fontWeight: 600 }}>담당자 {model.owner}</span>
                    </div>
                    <div style={{ color: '#52606d', fontSize: '.85rem', marginBottom: 8 }}>알고리즘 {model.type}</div>
                    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', color: '#6b7c93', fontSize: '.85rem' }}>
                      <span>모델 ID {model.id}</span>
                      <span>모델 생성일 {model.created}</span>
                      <span>최근 실행일 {model.lastRun}</span>
                      <span>다음 실행일 {model.nextRun}</span>
                      <span>
                        대표 지표 <b style={{ color: '#2c3e50' }}>{model.metrics[0]?.value}</b>
                        <b
                          style={{
                            marginLeft: 8,
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: '.74rem',
                            background: metricTone.background,
                            color: metricTone.color,
                            border: `1px solid ${metricTone.border}`,
                          }}
                        >
                          {metricTone.text}
                        </b>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenDetail(model)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 8,
                      border: '1px solid #3498db',
                      background: isOpened ? '#3498db' : '#fff',
                      color: isOpened ? '#fff' : '#3498db',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '.84rem',
                    }}
                  >
                    상세보기
                  </button>
                </div>
              </div>
            );
          })}

          {pagedModels.length === 0 ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: '32px 20px',
                border: '1px solid #dde5ed',
                color: '#6b7c93',
                textAlign: 'center',
                fontSize: '.95rem',
              }}
            >
              검색 조건에 맞는 모델이 없습니다.
            </div>
          ) : null}

          {totalPages > 1 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 8 }}>
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: 'none',
                  background: 'transparent',
                  color: currentPage === 1 ? '#c7cfd8' : '#34495e',
                  cursor: currentPage === 1 ? 'default' : 'pointer',
                  fontSize: 24,
                  lineHeight: 1,
                }}
                aria-label="이전 페이지"
              >
                ‹
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    minWidth: 32,
                    height: 36,
                    border: 'none',
                    background: 'transparent',
                    color: currentPage === page ? '#2ecc71' : '#111827',
                    fontSize: '1.1rem',
                    fontWeight: currentPage === page ? 700 : 600,
                    cursor: 'pointer',
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: 'none',
                  background: 'transparent',
                  color: currentPage === totalPages ? '#c7cfd8' : '#34495e',
                  cursor: currentPage === totalPages ? 'default' : 'pointer',
                  fontSize: 24,
                  lineHeight: 1,
                }}
                aria-label="다음 페이지"
              >
                ›
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}