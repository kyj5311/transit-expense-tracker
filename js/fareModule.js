/* ============================================================
   FareModule (FR-01, 설계서 4.2)
   지역 · 교통수단 · 요금등급별 기본 요금과 환승 할인율(TransferDC)을 관리한다.
   ============================================================ */

// 앱에 기본으로 내장된 지역별 요금 데이터.
// 지역이 늘어나도 이 배열에 항목만 추가하면 되고, 아래 함수들은 고칠 필요가 없다. (설계 원칙: 확장성)
// TransferDC: 환승 시 기본요금에 곱하는 비율. 0이면 환승 시 무료, 0.1이면 10%만 지불.
const DEFAULT_FARE_DATA = {
  Region: [
    {
      Name: '서울',
      Train: { Child: 450, Youth: 720, Adult: 1400, TransferDC: 0 },
      Bus:   { Child: 450, Youth: 720, Adult: 1400, TransferDC: 0 }
    },
    {
      Name: '대구',
      Train: { Child: 1000, Youth: 1350, Adult: 2000, TransferDC: 0.1 },
      Bus:   { Child: 750,  Youth: 1000, Adult: 1500, TransferDC: 0.1 }
    },
    // 구미: 대구-금오공과대학교 통학 테스트 데이터(dev-seed/daegu-kumoh-template.js)를 위해 추가한 지역.
    // Train은 대경선/무궁화호 등 대구↔구미 기차 구간, Bus는 구미역↔금오공대 셔틀/시내버스를 가정한 값이며,
    // 정확한 실제 운임을 조사한 수치가 아니라 테스트용으로 어림잡은 값이다.
    {
      Name: '구미',
      Train: { Child: 1300, Youth: 2080, Adult: 2600, TransferDC: 0.2 },
      Bus:   { Child: 700,  Youth: 1120, Adult: 1400, TransferDC: 0.2 }
    }
  ]
};

// 런타임에 올려두고 쓰는 요금 데이터(5.1의 "in-memory 변수"에 해당).
// initFareData()가 호출되기 전에는 아직 값이 없으므로 null로 시작한다.
let fareData = null;

// 불러온 요금 데이터가 앱이 쓸 수 있는 형태인지 검사한다 (EH-02, 검수 결함 ERROR-01).
// Region이 비어 있지 않은 배열이고, 각 지역이 이름(Name)을 가진 객체여야 한다.
// 기본 요금과 "같은 값"인지는 보지 않는다 — 예전 버전에서 저장된 요금 데이터('구미' 없음 등)도
// 형태만 맞으면 그대로 쓰고, 요금표에 없는 지역은 findFare()가 0원으로 처리한다.
function isValidFareData(data) {
  return !!data && Array.isArray(data.Region) && data.Region.length > 0 &&
    data.Region.every(function (region) {
      return !!region && typeof region.Name === 'string';
    });
}

// 앱 최초 실행 시 1회 호출되는 함수.
// LocalStorage에 저장된 fareData가 있으면 그대로 불러오고,
// 없으면(최초 실행) 기본 요금 데이터를 사용하고 StorageModule을 통해 1회 저장한다.
// 저장된 값이 잘못된 형태(예: 객체 자리에 문자열)이면 앱이 멈추지 않도록 기본 요금 데이터로 초기화한다.
function initFareData() {
  const loaded = load('fareData');

  if (isValidFareData(loaded)) {
    fareData = loaded;
  } else {
    if (loaded !== null) {
      console.warn('[FareModule] 저장된 요금 데이터 형태가 올바르지 않아 기본 요금 데이터로 초기화합니다:', loaded);
    }
    fareData = DEFAULT_FARE_DATA;
    save('fareData', fareData);
  }

  return fareData;
}

// 지역명(regionName)으로 해당 지역의 요금 정보 객체를 찾아 반환한다.
// 찾는 지역이 없으면 undefined를 반환한다 (호출하는 쪽에서 존재 여부를 확인해야 함).
function getRegionFare(regionName) {
  return fareData.Region.find(function (region) {
    return region.Name === regionName;
  });
}
