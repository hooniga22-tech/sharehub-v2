import pandas as pd
import json
import uuid
import re

# 입주자 시트: header=2 → 첫 행이 실제 컬럼 라벨, 그 다음이 데이터
raw = pd.read_excel('./data_import.xlsx', sheet_name='입주자', header=None, skiprows=3)
# 컬럼명 수동 설정 (엑셀 구조 확인 결과)
cols = ['지역','하우스','자리','구분','계약자','계약시작','계약종료','추가사항','공실',
        '보증금','6개월가격','할인','월세','관리비','생년월일','연락처','주소',
        '하우스2','자리2','투자자','계좌','투자자연락처','투자자생년월일','잔금','_1','_2']
raw.columns = cols[:len(raw.columns)]
df = raw[raw['계약자'].notna()].copy()
# 실제 데이터 행만 (지역 행 제거)
df = df[df['지역'] != '지역'].copy()
df = df[df['계약자'].astype(str).str.strip() != ''].copy()

print(f"원본 행: {len(raw)}, 유효 행: {len(df)}")

# 1. 지점
houses_raw = df.drop_duplicates(subset=['하우스'])[['지역','하우스','주소','투자자','계좌','투자자연락처']].copy()
houses = []
house_id_map = {}
for idx, (_, row) in enumerate(houses_raw.iterrows()):
    hname = str(row['하우스']).strip()
    if hname in ['nan', '']: continue
    hid = f"house_{str(idx+1).zfill(3)}"
    house_id_map[hname] = hid
    houses.append([
        hid, hname,
        str(row['지역']).strip() if pd.notna(row['지역']) else '',
        str(row['주소']).strip() if pd.notna(row['주소']) else '',
        '', '', '', 0, 0, 0,
        str(row['투자자']).strip() if pd.notna(row['투자자']) else '',
        str(row['투자자연락처']).strip() if pd.notna(row['투자자연락처']) else '',
        str(row['계좌']).strip() if pd.notna(row['계좌']) else '',
    ])

# 2. 방
rooms = []
room_id_map = {}
seen_rooms = set()
for i, (_, row) in enumerate(df.iterrows()):
    hname = str(row['하우스']).strip()
    room_code = str(row['자리']).strip() if pd.notna(row['자리']) else ''
    key = (hname, room_code)
    if key in seen_rooms: continue
    seen_rooms.add(key)
    room_type = str(row['구분']).strip() if pd.notna(row['구분']) else '1인실'
    rent = int(float(row['월세'])) if pd.notna(row['월세']) else 0
    rid = f"room_{str(len(rooms)+1).zfill(3)}"
    room_id_map[key] = rid
    rooms.append([rid, house_id_map.get(hname,''), hname, room_code, room_type, '', rent, ''])

# 3. 입주자
def parse_date(val):
    if pd.isna(val): return ''
    s = str(val).strip()
    try: return pd.to_datetime(s).strftime('%Y-%m-%d')
    except: return s[:10]

tenants = []
skip_names = {'즉시입주', '', 'nan', 'NaN', '없음'}
for i, (_, row) in enumerate(df.iterrows()):
    name = str(row['계약자']).strip() if pd.notna(row['계약자']) else ''
    if name in skip_names: continue
    hname = str(row['하우스']).strip()
    room_code = str(row['자리']).strip() if pd.notna(row['자리']) else ''
    vacancy = str(row['공실']).strip() if pd.notna(row['공실']) else ''
    if vacancy in ['공실예정']:
        status = '퇴실예정'
    elif vacancy in ['공실', '운영종료']:
        status = '퇴실'
    else:
        status = '입주중'

    rent_val = row['월세']
    maint_val = row['관리비']
    dep_val = row['보증금']

    tenants.append([
        f"tenant_{str(len(tenants)+1).zfill(3)}",
        room_id_map.get((hname, room_code), ''),
        hname, room_code, name,
        str(row['연락처']).strip() if pd.notna(row['연락처']) else '',
        int(float(rent_val)) if pd.notna(rent_val) else 0,
        int(float(maint_val)) if pd.notna(maint_val) else 0,
        int(float(dep_val)) if pd.notna(dep_val) else 0,
        parse_date(row['계약시작']),
        parse_date(row['계약종료']),
        status, '',
        str(row['추가사항']).strip() if pd.notna(row['추가사항']) else '',
        str(uuid.uuid4())[:8],
    ])

with open('./scripts/parsed_data.json', 'w', encoding='utf-8') as f:
    json.dump({'houses': houses, 'rooms': rooms, 'tenants': tenants}, f, ensure_ascii=False, indent=2, default=str)

print(f"지점: {len(houses)}개 | 방: {len(rooms)}개 | 입주자: {len(tenants)}명")
print("파싱 완료")
