const Admin = { modules: {} };

const M = Admin.modules;
Admin.modules.files = (() => {
  return {
    async get() {
      const fetchOptions = {
        cache: "no-cache",
      };
      const response = await fetch("/files.json", fetchOptions);
      const data = await response.json();
      return data;
    },
  };
})();
Admin.modules.menu = (() => {
  const menu = [];
  return {
    menu() {
      return document.querySelector('#template-menu'); 
    },
    toggle() {
      this.menu().classList.toggle('closed');
      localStorage.setItem('template-menu-closed',this.menu().classList.contains('closed'))
    },
    close() {
      console.log('close')
      this.menu().classList.add('closed');
      localStorage.setItem('template-menu-closed',true)
    },
    build() {
      const href = document.location.href
      const html = [];
      menu.forEach(section => {
        html.push(`<ul><strong>${section.title}</strong>`)
        section.links.forEach(link => {
          html.push(`<li class="${href.includes(link.href)?'selected':''}">
              <a href="${link.href}"><span>${link.text}</span>
              <i>${link.description}</i>
              </a>
            </li>`)
        })
        html.push(`</ul>`)
      })
      const div = document.createElement('div')
      div.id='template-menu'
      div.innerHTML = html.join('');
      const closed = localStorage.getItem('template-menu-closed') ? localStorage.getItem('template-menu-closed')==='true' : true;
      console.log({closed})
      if(closed) 
        div.classList.add('closed')
      document.body.append(div)

      div.addEventListener('click',e => {
        const target = e.target;
        const a = target.closest('a');
        if(a) return;
        this.toggle()
      })
    },
    async start() {
      const files = await M.files.get();
      const section = {title:'Pages',links:[]}
      for(const pageSlug in files.pages) {
        const page = files.pages[pageSlug]
        section.links.push({text:page.name, href:page.uri, description:page.description??''})
      }
      menu.push(section)

      this.build()
    },
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  for (const module in Admin.modules) {
    if ("start" in Admin.modules[module]) {
      Admin.modules[module].start();
    }
  }
});

const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, wait);
  };
}