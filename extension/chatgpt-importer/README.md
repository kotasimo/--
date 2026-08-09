# 院試チャット保存 Chrome拡張

ChatGPTの個別チャットURLを読み取り、院試メモアプリの `chatgpt_conversations` に保存します。

## 使い方

1. Chromeで `chrome://extensions/` を開く。
2. 右上の「デベロッパーモード」をオンにする。
3. 「パッケージ化されていない拡張機能を読み込む」を押す。
4. このフォルダを選ぶ。

```text
extension/chatgpt-importer
```

5. 拡張アイコンを押す。
6. Supabase URL と Publishable key を入れる。
7. 院試サイトで問題の「チャット」を開く。
8. 「ChatGPTに質問」を押す。
9. ChatGPTで新しいチャットを始める。

ChatGPTのURLが `https://chatgpt.com/c/...` になったら、そのURLを該当問題へ自動保存します。

手動で保存したい場合は、ChatGPTの会話ページで拡張アイコンを押し、科目と年度を選んで「このURLを保存」を押します。

## ChatGPT URL保存

`chatgpt_conversations` に現在のChatGPTチャットURLを保存します。

```json
{
  "owner_type": "past_exam",
  "owner_id": "thermo:2024",
  "subject": "thermo",
  "title": "2024 熱力",
  "chatgpt_url": "https://chatgpt.com/c/..."
}
```

## 注意

ChatGPTのURL形式が変わると、`content.js` のURL検知処理を直す必要があります。
