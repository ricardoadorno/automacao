import { Page } from "playwright";
import { BehaviorAction } from "./behaviors";
import { applyViewport, applyZoom, scrollBy, scrollTo } from "./viewport";

export async function runActions(page: Page, actions: BehaviorAction[]): Promise<void> {
  for (const action of actions) {
    await runAction(page, action);
  }
}

async function runAction(page: Page, action: BehaviorAction): Promise<void> {
  switch (action.type) {
    case "goto":
      await page.goto(action.url, { waitUntil: "domcontentloaded", timeout: 30000 });
      return;
    case "click":
      await page.click(action.selector);
      return;
    case "fill":
      await page.fill(action.selector, action.text);
      return;
    case "waitForSelector":
      await page.waitForSelector(action.selector, { state: action.state });
      return;
    case "waitForTimeout":
      await page.waitForTimeout(action.ms);
      return;
    case "waitForLoadState":
      await page.waitForLoadState(action.state ?? "load");
      return;
    case "scrollTo":
      await scrollTo(page, action.x, action.y);
      return;
    case "scrollBy":
      await scrollBy(page, action.x, action.y);
      return;
    case "setViewport":
      await applyViewport(page, {
        width: action.width,
        height: action.height,
        deviceScaleFactor: action.deviceScaleFactor
      });
      return;
    case "setZoom":
      await applyZoom(page, action.scale);
      return;
    case "evaluate":
      await page.evaluate(action.script);
      return;
    case "search":
      await page.evaluate((searchText) => {
        // Remove destaques anteriores
        document.querySelectorAll('mark.search-highlight').forEach(el => {
          const parent = el.parentNode;
          if (parent) {
            parent.replaceChild(document.createTextNode(el.textContent || ''), el);
          }
        });
        
        // Função para destacar texto recursivamente
        function highlightText(node: Node, text: string) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent) {
            const content = node.textContent;
            const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            if (regex.test(content)) {
              const span = document.createElement('span');
              span.innerHTML = content.replace(regex, (match) => 
                `<mark class="search-highlight" style="background-color: #ffff00; color: #000; padding: 2px;">${match}</mark>`
              );
              node.parentNode?.replaceChild(span, node);
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            // Não processar scripts, styles, inputs
            if (!['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
              Array.from(node.childNodes).forEach(child => highlightText(child, text));
            }
          }
        }
        
        highlightText(document.body, searchText);
        
        // Scroll para o primeiro resultado
        const firstHighlight = document.querySelector('mark.search-highlight');
        if (firstHighlight) {
          firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, action.text);
      return;
    default: {
      const _exhaustive: never = action;
      throw new Error(`Unsupported action: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
