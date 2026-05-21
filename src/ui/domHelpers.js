export function inputValue(id) {
  return document.getElementById(id)?.value || '';
}

export function tagValues(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];

  return Array.from(container.children)
    .map(element => element.textContent.replace('×', '').replace('Ã—', '').trim())
    .filter(Boolean);
}

export function stripHtml(value) {
  const div = document.createElement('div');
  div.innerHTML = value;
  return div.textContent || div.innerText || '';
}

export function getVisibleScreenId(fallbackScreen = 'bookList') {
  const screens = [
    'bookList',
    'bookDetails',
    'characterDetails',
    'locationDetails',
    'plotPointDetails',
    'noteDetails',
    'noteEditor',
    'chapterDetails',
    'sceneDetails',
    'taggedItems',
    'relationshipGraph'
  ];

  return screens.find(screen => {
    const element = document.getElementById(screen);
    return element && element.style.display !== 'none';
  }) || fallbackScreen;
}
