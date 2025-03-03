describe('Chat Bot', () => {
  beforeEach(() => {
    // 各テスト前にトップページを訪問
    cy.visit('/');
    // APIレスポンスをモック
    cy.intercept('POST', '/api/chat', {
      statusCode: 200,
      body: {
        role: 'assistant',
        content: 'これはモックレスポンスです。実際のAPIは呼び出されていません。',
      },
    }).as('chatRequest');
  });

  it('should display the initial greeting message', () => {
    // 初期メッセージが表示されていることを確認
    cy.contains('こんにちは！何かお手伝いできることはありますか？');
  });

  it('should send a message and receive a response', () => {
    // メッセージを入力して送信
    const testMessage = 'テストメッセージ';
    cy.get('input[type="text"]').type(testMessage);
    cy.contains('送信').click();

    // ユーザーメッセージが表示されたことを確認
    cy.contains(testMessage);

    // APIリクエストが完了するのを待つ
    cy.wait('@chatRequest');

    // AIの応答が表示されることを確認
    cy.contains('これはモックレスポンスです。実際のAPIは呼び出されていません。');
  });

  it('should not send an empty message', () => {
    // 空のメッセージで送信ボタンを確認
    cy.get('button[type="submit"]').should('be.disabled');
  });
});
