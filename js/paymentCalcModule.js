/* ============================================================
   PaymentCalcModule (FR-05, EH-03, 설계서 4.2)
   골라진 사용 내역(targetLogs)에 대한 총 지불 금액을 계산한다.
   "어떤 내역을 계산 대상으로 고를지"(월/년 단위, 개별 체크 등)는 UIModule의 몫이고,
   이 모듈은 이미 골라진 배열을 받아 합산만 하는 순수 계산기 역할만 한다.
   ============================================================ */

// targetLogs: 계산 대상 사용 내역 배열 / fareData: 요금 데이터 객체
// 반환값: 총 지불 금액(숫자, 원 단위)
//
// 처리 로직 (설계서 6.2 그대로):
//   ① 각 내역의 지역·교통수단·요금등급으로 fareData에서 기본요금 조회
//   ② IsTransfer가 true면 기본요금 × TransferDC 적용
//   ③ 전체 합산
//
// 대상 내역이 0건이면 0을 반환한다 (EH-03) — reduce는 빈 배열이어도 초기값 0을 그대로
// 돌려주기 때문에 사실 별도 분기 없이도 안전하지만, 설계서에 "예외 처리"로 명시된 항목이라
// 의도를 코드에서도 분명히 드러나도록 조건문을 남겨뒀다.
function calculatePayment(targetLogs, fareData) {
  if (!targetLogs || targetLogs.length === 0) {
    return 0;
  }

  return targetLogs.reduce(function (total, log) {
    return total + calculateSingleFare(log, fareData);
  }, 0);
}

// 내역 한 건에 해당하는 요금표를 찾아 { baseFare, transferDC } 형태로 반환한다.
// fareData에서 log.Region으로 지역을 찾고 → log.Type(Train/Bus)으로 요금표를 좁히고
// → log.AgeType(Child/Youth/Adult)으로 기본요금을 꺼낸다.
//
// 셋 중 하나라도 요금 데이터에 없으면 null을 반환한다. 예: LocalStorage에 예전 요금 데이터가
// 저장된 브라우저에서, 그 뒤에 추가된 지역('구미' 등)의 내역이 들어온 경우. 이때 오류로 멈추지
// 않고 호출하는 쪽이 "요금 정보 없음"으로 처리할 수 있게 한다 (8장 안정성: 예외 상황에도 멈추지 않음).
//
// FareModule에도 이름으로 지역을 찾는 getRegionFare()가 있지만, 그 함수는 FareModule
// 내부의 전역 fareData 변수를 사용한다. 이 함수는 파라미터로 받은 fareData만 가지고
// 조회하는 "순수 함수"로 만들기 위해 조회 로직을 따로 두었다 —
// 입력만 보면 결과를 알 수 있어서 테스트하거나 동작을 예측하기 쉽다.
function findFare(log, fareData) {
  const region = fareData.Region.find(function (r) {
    return r.Name === log.Region;
  });
  const fareTable = region ? region[log.Type] : null;

  if (!fareTable || typeof fareTable[log.AgeType] !== 'number') {
    return null;
  }

  return { baseFare: fareTable[log.AgeType], transferDC: fareTable.TransferDC };
}

// 내역 한 건의 실제 지불 금액을 계산하는 도우미 함수.
// 기본요금을 찾아서, 환승이면 TransferDC를 곱한다. 요금 정보를 찾지 못하면 0원으로 계산한다.
function calculateSingleFare(log, fareData) {
  const fare = findFare(log, fareData);

  if (!fare) {
    return 0;
  }

  return log.IsTransfer ? fare.baseFare * fare.transferDC : fare.baseFare;
}
