# APIエラーのユーザー向け表示

`getUserFacingApiError` は、技術的なAPIエラーを、UIで安全に表示できるローカライズ済みの情報へ変換します。HTTPステータステキスト、例外メッセージ、レスポンス本文はユーザーに公開しません。

## 戻り値

この関数は以下の情報を返します。

- `category`: UIが文脈に応じた判断に利用できる安定したカテゴリ
- `message`: ローカライズ済みのユーザー向けメッセージ
- `canRetry`: 失敗したリクエストの再試行が妥当かどうか

## 分類ルール

| エラーの種類                                     | カテゴリ          |
| ------------------------------------------------ | ----------------- |
| ネットワークエラー                               | `network`         |
| タイムアウトまたはHTTP 408                       | `timeout`         |
| HTTP 401                                         | `unauthorized`    |
| HTTP 403                                         | `forbidden`       |
| HTTP 404または410                                | `notFound`        |
| HTTP 409                                         | `conflict`        |
| HTTP 400または422                                | `validation`      |
| HTTP 429                                         | `rateLimited`     |
| HTTP 5xx                                         | `server`          |
| JSONの解析失敗                                   | `invalidResponse` |
| キャンセル、未対応のHTTPステータス、非`ApiError` | `unknown`         |

`canRetry` は `ApiError.retryable` に従います。これにより、ユーザー向けの再試行案内とReact Queryのリトライ方針が一致します。

## 使用方法

一般的なエラー表示では、カテゴリに対応するデフォルトメッセージを使用します。

```tsx
const presentation = getUserFacingApiError(query.error);

<SectionErrorState
  message={presentation.message}
  onRetry={presentation.canRetry ? () => void query.refetch() : undefined}
/>;
```

画面固有の意味を持つカテゴリだけ、文脈に合ったメッセージで上書きします。

```ts
const presentation = getUserFacingApiError(tournamentError, {
  messageOverrides: {
    notFound: t('tournamentPage.tournamentNotFound'),
  },
});
```

Mutationのフィードバックでは、この変換処理を共通で使用します。UIから意図的に文脈固有の説明を渡す場合は、呼び出し元が指定した `message` が引き続き優先されます。既存の `fallback` は、分類できないエラーに対してのみ使用されます。
