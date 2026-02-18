import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';
import puppeteer from 'puppeteer';
import TurndownService from 'turndown';

export interface ParsedDocument {
  title: string;
  content: string;
  url: string;
  hash: string;
}

@Injectable()
export class ParserService {
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });

    // 코드 블록 처리 개선
    this.turndownService.addRule('codeBlock', {
      filter: ['pre'],
      replacement: (content, node) => {
        const element = node as HTMLElement;
        const codeElement = element.querySelector('code');
        const code = codeElement ? codeElement.textContent : element.textContent;
        const lang = codeElement?.className?.match(/language-(\w+)/)?.[1] || '';
        return `\n\n\`\`\`${lang}\n${code?.trim()}\n\`\`\`\n\n`;
      },
    });

    // 불필요한 요소 제거
    this.turndownService.remove(['script', 'style', 'nav', 'footer', 'aside']);
  }

  async parseUrl(url: string): Promise<ParsedDocument> {
    // 먼저 axios로 시도
    let html = await this.fetchWithAxios(url);
    let $ = cheerio.load(html);

    let content = this.extractContent($);

    // 콘텐츠가 너무 짧으면 SPA라 판단하고 Puppeteer로 재시도
    if (content.length < 200) {
      console.log('Content too short, trying with Puppeteer...');
      html = await this.fetchWithPuppeteer(url);
      $ = cheerio.load(html);
      content = this.extractContent($);
    }

    const title =
      $('h1').first().text().trim() || $('title').text().trim() || 'Untitled';

    const hash = this.createHash(content);

    return { title, content, url, hash };
  }

  private async fetchWithAxios(url: string): Promise<string> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Doc2Learn/1.0)',
      },
    });
    return response.data;
  }

  private async fetchWithPuppeteer(url: string): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      return await page.content();
    } finally {
      await browser.close();
    }
  }

  // 본문 HTML을 추출하고 마크다운으로 변환
  private extractContent($: cheerio.CheerioAPI): string {
    // 불필요한 요소 제거
    $('script, style, nav, footer, aside, .sidebar, .navigation, .menu, .ads, .advertisement').remove();

    const selectors = ['article', 'main', '.content', '#content', '.post', '.entry-content', '.documentation'];

    let contentHtml = '';

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const html = element.html();
        if (html && html.length > 100) {
          contentHtml = html;
          break;
        }
      }
    }

    // 적절한 컨테이너를 못 찾으면 body 사용
    if (!contentHtml) {
      contentHtml = $('body').html() || '';
    }

    // HTML을 마크다운으로 변환
    const markdown = this.turndownService.turndown(contentHtml);

    // 연속된 빈 줄 정리
    return markdown.replace(/\n{3,}/g, '\n\n').trim();
  }

  // 해당 링크의 문서 내용이 마지막 로컬 저장 시점 이후 변경되었는지 확인하기 위해 내용을 해싱해 저장
  createHash(content: string): string {
    const normalized = content.replace(/\s+/g, ' ').trim();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }
}