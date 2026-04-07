export interface House {
  id: string; name: string; district: string; address: string;
  password: string; wifiSsid: string; wifiPassword: string;
  landlordRent: number; investorRatio: number; operatorRatio: number;
  landlordName: string; landlordPhone: string; memo: string;
}
export interface Room {
  id: string; houseId: string; houseName: string; code: string;
  type: '1인실' | '2인실'; area: string; baseRent: number; memo: string;
}
export interface Tenant {
  id: string; roomId: string; houseName: string; roomCode: string;
  name: string; phone: string; rent: number; managementFee: number;
  deposit: number; startDate: string; endDate: string;
  status: '입주중' | '퇴실예정' | '퇴실'; nationality: string; memo: string; token: string;
}
export interface Cost {
  id: string; houseId: string; houseName: string; year: number; month: number;
  electricity: number; gas: number; water: number; internet: number;
  waterPurifier: number; management: number; cleaning: number; others: number; memo: string;
}
export interface Issue {
  id: string; houseName: string; roomCode: string; title: string; content: string;
  category: '수리' | '청소' | '민원' | '기타';
  status: '접수' | '진행중' | '완료' | '보류';
  assignee: string; createdAt: string; completedAt: string; cost: number; memo: string;
}
export interface Worker {
  id: string; name: string; houseName: string; taskType: string;
  scheduledDate: string; isDone: 'Y' | 'N'; payment: number;
  issueId: string; memo: string; token: string;
}
export interface Investor {
  id: string; name: string; houseId: string; houseName: string;
  ratio: number; token: string; phone: string; memo: string;
}
export interface UtilityCost {
  id: string;
  houseId: string;
  houseName: string;
  year: number;
  month: number;
  electricity: number;
  gas: number;
  water: number;
  internet: number;
  waterPurifier: number;
  cleaning: number;
  others: number;
  memo: string;
  createdAt: string;
}
