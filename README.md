# 名大院試 過去問メモ

名古屋大学工学部系の院試過去問を、科目・年度ごとに記録するためのReactアプリです。

## 開発

```powershell
npm install
npm run dev
```

ブラウザで `http://localhost:8765/` を開きます。

## 今の構成

- `src/components`: 画面部品
- `src/data`: 科目、年度、表項目などの固定データ
- `src/services`: メモや表データの保存処理
- `supabase/schema.sql`: Supabaseに貼るDB/Storage作成SQL
- `public/problems`: 問題画像
- `public/answers`: 手書き解答画像
- `public/answers.js`: 年度ごとの解答画像対応表
- `public/solutions.js`: 概略解答メモ
- `work`: PDFから画像を作るスクリプト
- `outputs/problem_site`: 以前の静的HTML版

## これから自分でやるところ

1. GitHubに保存する場合は、GitHubでPrivateリポジトリを作る。
2. Supabaseでプロジェクトを作る。
3. SupabaseのSQL Editorで `supabase/schema.sql` の中身を実行する。
4. `.env.local` にSupabaseの接続情報を入れる。
5. Vercelなどに公開する場合は、同じ環境変数をホスティング側にも登録する。

## Supabase設定

`.env.example` をコピーして `.env.local` を作ります。

```env
VITE_SUPABASE_URL=SupabaseのProject URL
VITE_SUPABASE_PUBLISHABLE_KEY=SupabaseのPublishable key
```

古いSupabase画面で `anon public key` しか見つからない場合は、その値を `VITE_SUPABASE_PUBLISHABLE_KEY` に入れて使えます。

`.env.local` がない場合はローカル保存で動きます。`.env.local` がある場合はSupabase保存に切り替わります。

追加問題を使う場合も、同じ `supabase/schema.sql` をSQL Editorで再実行します。既存テーブルは壊さず、不足しているテーブルだけ追加されます。

## Supabaseのテーブル

`study_records`

- `user_id`
- `subject`
- `year`
- `status`
- `difficulty`
- `score`
- `formula`
- `memo`
- `updated_at`

`submission_images`

- `user_id`
- `subject`
- `year`
- `image_url`
- `created_at`
