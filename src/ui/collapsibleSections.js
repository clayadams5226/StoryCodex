export async function initializeCollapsibleSections(storage = chrome.storage.sync) {
  const result = await storage.get('collapsibleSectionsState');
  const savedState = result.collapsibleSectionsState || {};
  const collapsibleSections = document.querySelectorAll('.collapsible-section');

  collapsibleSections.forEach(section => {
    const header = section.querySelector('.collapsible-header');
    const content = section.querySelector('.collapsible-content');
    const icon = header?.querySelector('.collapse-icon');
    const sectionName = section.getAttribute('data-section');

    if (!header || !content || !icon || !sectionName) return;

    const isCollapsed = savedState[sectionName] !== undefined
      ? savedState[sectionName]
      : sectionName !== 'basic-details';

    applyCollapsedState(section, content, icon, isCollapsed);

    header.addEventListener('click', async () => {
      const nextCollapsed = !section.classList.contains('collapsed');
      applyCollapsedState(section, content, icon, nextCollapsed);
      savedState[sectionName] = nextCollapsed;
      await storage.set({ collapsibleSectionsState: savedState });
    });
  });
}

export function observeCollapsibleSections(targetId = 'characterDetails') {
  const target = document.getElementById(targetId);
  if (!target) return null;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.id === targetId && mutation.target.style.display !== 'none') {
        initializeCollapsibleSections();
      }
    });
  });

  observer.observe(target, {
    attributes: true,
    attributeFilter: ['style']
  });

  return observer;
}

function applyCollapsedState(section, content, icon, isCollapsed) {
  if (isCollapsed) {
    section.classList.add('collapsed');
    content.style.display = 'none';
    icon.textContent = '>';
  } else {
    section.classList.remove('collapsed');
    content.style.display = 'block';
    icon.textContent = 'v';
  }
}
