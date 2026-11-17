import json
import os
import time

import requests

TG_TOKEN = os.environ["TG_TOKEN"]
API_KEY = os.environ["GEMINI_API_KEY"]
MODEL = os.environ.get("GEMINI_MODEL", "gemini-4-hydrogen")
HISTORY_FILE = "history.json"
MAX_MESSAGES = 30

SYSTEM = (
    "Sen foydalanuvchining shaxsiy yordamchisisan. "
    "O'zbek tilida qisqa va aniq javob ber. "
    "Foydalanuvchi boshqa tilda yozsa, o'sha tilda javob ber."
)

TG = f"https://api.telegram.org/bot{TG_TOKEN}"
GEMINI = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"


def load_history():
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_history(h):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(h, f, ensure_ascii=False)


def ask_gemini(messages):
    contents = [
        {"role": m["role"], "parts": [{"text": m["text"]}]} for m in messages
    ]
    r = requests.post(
        GEMINI,
        headers={"x-goog-api-key": API_KEY, "content-type": "application/json"},
        json={
            "systemInstruction": {"parts": [{"text": SYSTEM}]},
            "contents": contents,
        },
        timeout=90,
    )
    r.raise_for_status()
    return r.json()["candidates"][0]["content"]["parts"][0]["text"]


def send(chat_id, text):
    requests.post(
        f"{TG}/sendMessage",
        json={"chat_id": chat_id, "text": text[:4000]},
        timeout=30,
    )


def main():
    history = load_history()
    offset = 0
    print("Bot ishga tushdi, model:", MODEL)
    while True:
        try:
            r = requests.get(
                f"{TG}/getUpdates",
                params={"offset": offset, "timeout": 30},
                timeout=40,
            )
            for u in r.json().get("result", []):
                offset = u["update_id"] + 1
                msg = u.get("message")
                if not msg or "text" not in msg:
                    continue
                chat_id = str(msg["chat"]["id"])
                text = msg["text"]

                if text == "/start":
                    send(chat_id, "Salom! Men sizning yordamchingizman. Nima kerak?")
                    continue
                if text == "/reset":
                    history[chat_id] = []
                    save_history(history)
                    send(chat_id, "Suhbat tozalandi.")
                    continue

                msgs = history.get(chat_id, [])
                msgs.append({"role": "user", "text": text})
                msgs = msgs[-MAX_MESSAGES:]
                while msgs and msgs[0]["role"] != "user":
                    msgs.pop(0)

                try:
                    answer = ask_gemini(msgs)
                except Exception as e:
                    send(chat_id, f"Xatolik: {e}")
                    continue

                msgs.append({"role": "model", "text": answer})
                history[chat_id] = msgs
                save_history(history)
                send(chat_id, answer)
        except Exception as e:
            print("Xato:", e)
            time.sleep(5)


if __name__ == "__main__":
    main()
