const BASE_URL = 'https://api.mail.tm';

export interface MailtmAccount {
  id: string;
  address: string;
  token: string;
}

export const mailtm = {
  async getDomains() {
    const res = await fetch(`${BASE_URL}/domains`);
    const data = await res.json();
    return data['hydra:member'];
  },

  async quickCreate(): Promise<MailtmAccount> {
    const domains = await this.getDomains();
    const domain = domains[0].domain;
    const address = `${Math.random().toString(36).substring(7)}@${domain}`;
    const password = 'password123';

    // 1. 创建账号并获取 ID
    const createRes = await fetch(`${BASE_URL}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    const accountData = await createRes.json();

    // 2. 获取 Token
    const tokenRes = await fetch(`${BASE_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    const { token } = await tokenRes.json();
    
    // 补全 ID 返回，这是 ThreeColumnLayout 运行的关键
    return { id: accountData.id, address, token };
  },

  async getMessages(token: string) {
    const res = await fetch(`${BASE_URL}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return data['hydra:member'] || [];
  }
};
