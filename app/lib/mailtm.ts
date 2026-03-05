// app/lib/mailtm.ts
const BASE_URL = 'https://api.mail.tm';

export interface MailtmAccount {
  id: string;
  address: string;
  token: string;
}

export const mailtm = {
  // 获取所有可用域名
  async getDomains() {
    const res = await fetch(`${BASE_URL}/domains`);
    const data = await res.json();
    return data['hydra:member']; // 返回域名数组
  },

  // 注册并获取 Token
  async quickCreate() {
    const domains = await this.getDomains();
    const domain = domains[0].domain;
    const address = `${Math.random().toString(36).substring(7)}@${domain}`;
    const password = 'password123'; // 静态模式下可以简单处理

    // 创建账号
    await fetch(`${BASE_URL}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });

    // 登录获取 Token
    const tokenRes = await fetch(`${BASE_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    const { token } = await tokenRes.json();
    
    return { address, token };
  },

  // 获取邮件列表
  async getMessages(token: string) {
    const res = await fetch(`${BASE_URL}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return data['hydra:member'];
  }
};
