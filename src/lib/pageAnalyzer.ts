import type { PageElements, RawElement } from '../types';
import { analyzeUrl } from '../services/api';

function processElements(rawElements: RawElement[]): PageElements {
  const elements: PageElements = {
    id: [],
    class: [],
    tag: []
  };

  // Count occurrences of each tag
  const tagCounts = new Map<string, number>();
  const idCounts = new Map<string, number>();
  const classCounts = new Map<string, number>();

  rawElements.forEach(element => {
    // Count tags
    tagCounts.set(element.tag, (tagCounts.get(element.tag) || 0) + 1);

    // Count IDs
    if (element.id) {
      idCounts.set(element.id, (idCounts.get(element.id) || 0) + 1);
    }

    // Count classes
    if (element.class) {
      element.class.forEach(className => {
        classCounts.set(className, (classCounts.get(className) || 0) + 1);
      });
    }
  });

  // Process tags
  Array.from(tagCounts.entries()).forEach(([tag, count]) => {
    const example = rawElements.find(el => el.tag === tag);
    elements.tag.push({
      selector: tag,
      count,
      example: `<${tag}>${tag === 'img' ? '' : '...'}</${tag}>`
    });
  });

  // Process IDs
  Array.from(idCounts.entries()).forEach(([id, count]) => {
    const example = rawElements.find(el => el.id === id);
    elements.id.push({
      selector: `#${id}`,
      count,
      example: `<${example?.tag || 'div'} id="${id}">...</${example?.tag || 'div'}>`
    });
  });

  // Process classes
  Array.from(classCounts.entries()).forEach(([className, count]) => {
    const example = rawElements.find(el => el.class?.includes(className));
    elements.class.push({
      selector: `.${className}`,
      count,
      example: `<${example?.tag || 'div'} class="${className}">...</${example?.tag || 'div'}>`
    });
  });

  // Sort by count (descending) and then alphabetically
  const sortFn = (a: { count: number, selector: string }, b: { count: number, selector: string }) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.selector.localeCompare(b.selector);
  };

  elements.id.sort(sortFn);
  elements.class.sort(sortFn);
  elements.tag.sort(sortFn);

  return elements;
}

export async function analyzePage(url: string): Promise<PageElements> {
  try {
    const rawElements = await analyzeUrl(url);
    return processElements(rawElements);
  } catch (error) {
    console.error('Error analyzing page:', error);
    throw error;
  }
}
