export interface CitationData {
  authors: string[];
  title: string;
  journalTitle: string;
  volume?: string;
  firstPage?: number | null;
  lastPage?: number | null;
  doi?: string | null;
  publishDate?: string | null;
  url?: string;
}

export type CitationStyle =
  | 'APA' | 'Harvard' | 'MLA' | 'Vancouver' | 'Chicago'
  | 'IEEE' | 'AMA' | 'Turabian' | 'OSCOLA' | 'ABNT' | 'CSE' | 'ACS'
  | 'GOST' | 'NLM' | 'ACM' | 'Nature' | 'Science' | 'AMS' | 'BMJ' | 'Springer';

export const CITATION_STYLES: { label: string; value: CitationStyle }[] = [
  { label: 'APA (7th ed.)', value: 'APA' },
  { label: 'Harvard', value: 'Harvard' },
  { label: 'MLA (9th ed.)', value: 'MLA' },
  { label: 'Vancouver', value: 'Vancouver' },
  { label: 'Chicago (17th ed.)', value: 'Chicago' },
  { label: 'IEEE', value: 'IEEE' },
  { label: 'AMA (11th ed.)', value: 'AMA' },
  { label: 'Turabian (9th ed.)', value: 'Turabian' },
  { label: 'OSCOLA', value: 'OSCOLA' },
  { label: 'ABNT (NBR 6023)', value: 'ABNT' },
  { label: 'CSE (8th ed.)', value: 'CSE' },
  { label: 'ACS (3rd ed.)', value: 'ACS' },
  { label: 'GOST R 7.0.5-2008', value: 'GOST' },
  { label: 'NLM', value: 'NLM' },
  { label: 'ACM', value: 'ACM' },
  { label: 'Nature', value: 'Nature' },
  { label: 'Science', value: 'Science' },
  { label: 'AMS', value: 'AMS' },
  { label: 'BMJ', value: 'BMJ' },
  { label: 'Springer', value: 'Springer' },
];

export type ExportFormat = 'bibtex' | 'ris' | 'csl-json' | 'endnote-xml' | 'plain-text' | 'csv' | 'mods-xml' | 'refer' | 'marc-xml' | 'jats-xml';

export const EXPORT_FORMATS: { label: string; value: ExportFormat; ext: string }[] = [
  { label: 'BibTeX', value: 'bibtex', ext: '.bib' },
  { label: 'RIS', value: 'ris', ext: '.ris' },
  { label: 'CSL JSON', value: 'csl-json', ext: '.json' },
  { label: 'EndNote XML', value: 'endnote-xml', ext: '.xml' },
  { label: 'Plain Text', value: 'plain-text', ext: '.txt' },
  { label: 'CSV', value: 'csv', ext: '.csv' },
  { label: 'MODS XML', value: 'mods-xml', ext: '.xml' },
  { label: 'Refer / BibIX', value: 'refer', ext: '.refer' },
  { label: 'MARC XML', value: 'marc-xml', ext: '.xml' },
  { label: 'JATS XML', value: 'jats-xml', ext: '.xml' },
];

function getYear(date?: string | null): string {
  if (!date) return 'n.d.';
  return new Date(date).getFullYear().toString();
}

function getMonth(date?: string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleString('en', { month: 'long' });
}

function getDay(date?: string | null): string {
  if (!date) return '';
  return new Date(date).getDate().toString();
}

function pages(d: CitationData): string {
  if (d.firstPage && d.lastPage) return `${d.firstPage}–${d.lastPage}`;
  if (d.firstPage) return `${d.firstPage}`;
  return '';
}

function doiUrl(d: CitationData): string {
  return d.doi ? `https://doi.org/${d.doi}` : '';
}

/** "Last, F. M." style */
function apaAuthor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(p => p[0].toUpperCase() + '.').join(' ');
  return `${last}, ${initials}`;
}

/** "Last, First" style */
function chicagoAuthor(name: string, first: boolean): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const rest = parts.slice(0, -1).join(' ');
  return first ? `${last}, ${rest}` : `${rest} ${last}`;
}

/** "Last F.M." Vancouver/NLM style */
function vancouverAuthor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(p => p[0].toUpperCase()).join('');
  return `${last} ${initials}`;
}

function joinAuthors(authors: string[], formatter: (n: string, i: number) => string, separator = ', ', lastSep = ', & '): string {
  if (!authors.length) return '';
  const formatted = authors.map((a, i) => formatter(a, i));
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return formatted.join(lastSep);
  return formatted.slice(0, -1).join(separator) + lastSep + formatted[formatted.length - 1];
}

export function formatCitation(d: CitationData, style: CitationStyle): string {
  const year = getYear(d.publishDate);
  const pg = pages(d);
  const doi = doiUrl(d);

  switch (style) {
    case 'APA': {
      const auth = joinAuthors(d.authors, (n) => apaAuthor(n));
      const pgPart = pg ? `, ${pg}` : '';
      const doiPart = doi ? ` ${doi}` : '';
      return `${auth} (${year}). ${d.title}. ${d.journalTitle}${d.volume ? `, ${d.volume}` : ''}${pgPart}.${doiPart}`;
    }

    case 'Harvard': {
      const auth = joinAuthors(d.authors, (n) => apaAuthor(n), ', ', ' and ');
      const pgPart = pg ? `, pp. ${pg}` : '';
      const doiPart = doi ? ` doi: ${d.doi}` : '';
      return `${auth} (${year}) '${d.title}', ${d.journalTitle}${d.volume ? `, ${d.volume}` : ''}${pgPart}.${doiPart}`;
    }

    case 'MLA': {
      const firstAuth = d.authors.length ? chicagoAuthor(d.authors[0], true) : '';
      const others = d.authors.length > 1 ? ', et al.' : '';
      const pgPart = pg ? `, pp. ${pg}` : '';
      const doiPart = doi ? ` ${doi}` : '';
      return `${firstAuth}${others}. "${d.title}." ${d.journalTitle}, vol. ${d.volume || ''}${pgPart}, ${year}.${doiPart}`;
    }

    case 'Vancouver': {
      const auth = d.authors.map(n => vancouverAuthor(n)).join(', ');
      const pgPart = pg ? `:${pg}` : '';
      const doiPart = doi ? ` doi: ${d.doi}` : '';
      return `${auth}. ${d.title}. ${d.journalTitle}. ${year}${d.volume ? `;${d.volume}` : ''}${pgPart}.${doiPart}`;
    }

    case 'Chicago': {
      const auth = joinAuthors(d.authors, (n, i) => chicagoAuthor(n, i === 0), ', ', ', and ');
      const pgPart = pg ? `: ${pg}` : '';
      const doiPart = doi ? ` ${doi}` : '';
      return `${auth}. "${d.title}." ${d.journalTitle} ${d.volume || ''} (${year})${pgPart}.${doiPart}`;
    }

    case 'IEEE': {
      const auth = d.authors.map(n => {
        const parts = n.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];
        const last = parts[parts.length - 1];
        const initials = parts.slice(0, -1).map(p => p[0].toUpperCase() + '.').join(' ');
        return `${initials} ${last}`;
      }).join(', ');
      const pgPart = pg ? `, pp. ${pg}` : '';
      const doiPart = doi ? `, doi: ${d.doi}` : '';
      return `${auth}, "${d.title}," ${d.journalTitle}, vol. ${d.volume || ''}${pgPart}, ${year}${doiPart}.`;
    }

    case 'AMA': {
      const auth = d.authors.map(n => vancouverAuthor(n)).join(', ');
      const pgPart = pg ? `:${pg}` : '';
      const doiPart = doi ? ` doi:${d.doi}` : '';
      return `${auth}. ${d.title}. ${d.journalTitle}. ${year};${d.volume || ''}${pgPart}.${doiPart}`;
    }

    case 'Turabian': {
      const auth = joinAuthors(d.authors, (n, i) => chicagoAuthor(n, i === 0), ', ', ', and ');
      const pgPart = pg ? `: ${pg}` : '';
      const doiPart = doi ? ` ${doi}` : '';
      return `${auth}. "${d.title}." ${d.journalTitle} ${d.volume || ''} (${year})${pgPart}.${doiPart}`;
    }

    case 'OSCOLA': {
      const auth = joinAuthors(d.authors, (n) => n, ', ', ' and ');
      const pgPart = pg ? ` ${pg}` : '';
      const doiPart = doi ? ` DOI: ${d.doi}` : '';
      return `${auth}, '${d.title}' (${year}) ${d.volume || ''} ${d.journalTitle}${pgPart}${doiPart}`;
    }

    case 'ABNT': {
      const auth = d.authors.map(n => {
        const parts = n.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].toUpperCase();
        const last = parts[parts.length - 1].toUpperCase();
        const rest = parts.slice(0, -1).join(' ');
        return `${last}, ${rest}`;
      }).join('; ');
      const month = getMonth(d.publishDate).toLowerCase().slice(0, 3);
      const pgPart = pg ? `, p. ${pg}` : '';
      const doiPart = doi ? ` DOI: ${d.doi}` : '';
      return `${auth}. ${d.title}. ${d.journalTitle}, v. ${d.volume || ''}${pgPart}, ${month}. ${year}.${doiPart}`;
    }

    case 'CSE': {
      const auth = d.authors.map(n => vancouverAuthor(n)).join(', ');
      const pgPart = pg ? `:${pg}` : '';
      const doiPart = doi ? ` doi:${d.doi}` : '';
      return `${auth}. ${year}. ${d.title}. ${d.journalTitle}. ${d.volume || ''}${pgPart}.${doiPart}`;
    }

    case 'ACS': {
      const auth = d.authors.map(n => {
        const parts = n.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];
        const last = parts[parts.length - 1];
        const initials = parts.slice(0, -1).map(p => p[0].toUpperCase() + '.').join(' ');
        return `${last}, ${initials}`;
      }).join('; ');
      const pgPart = pg ? `, ${pg}` : '';
      const doiPart = doi ? ` DOI: ${d.doi}` : '';
      return `${auth} ${d.title}. ${d.journalTitle} ${year}, ${d.volume || ''}${pgPart}.${doiPart}`;
    }

    case 'GOST': {
      const auth = d.authors.map(n => {
        const parts = n.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];
        const last = parts[parts.length - 1];
        const initials = parts.slice(0, -1).map(p => p[0].toUpperCase() + '.').join(' ');
        return `${last}, ${initials}`;
      }).join(', ');
      const pgPart = pg ? ` – S. ${pg}` : '';
      const doiPart = doi ? ` – DOI: ${d.doi}` : '';
      return `${auth} ${d.title} // ${d.journalTitle}. – ${year}.${d.volume ? ` – T. ${d.volume}` : ''}${pgPart}.${doiPart}`;
    }

    case 'NLM': {
      const auth = d.authors.map(n => vancouverAuthor(n)).join(', ');
      const pgPart = pg ? `:${pg}` : '';
      const doiPart = doi ? ` doi: ${d.doi}` : '';
      return `${auth}. ${d.title}. ${d.journalTitle}. ${year}${d.volume ? `;${d.volume}` : ''}${pgPart}.${doiPart}`;
    }

    case 'ACM': {
      const auth = joinAuthors(d.authors, (n) => n, ', ', ', and ');
      const pgPart = pg ? `, ${pg}` : '';
      const doiPart = doi ? ` ${doi}` : '';
      return `${auth}. ${year}. ${d.title}. ${d.journalTitle}${d.volume ? ` ${d.volume}` : ''}${pgPart}.${doiPart}`;
    }

    case 'Nature': {
      const auth = joinAuthors(d.authors, (n) => apaAuthor(n), ', ', ' & ');
      const pgPart = pg ? `, ${pg}` : '';
      const doiPart = doi ? ` (${doi})` : '';
      return `${auth} ${d.title}. ${d.journalTitle} ${d.volume || ''}${pgPart} (${year}).${doiPart}`;
    }

    case 'Science': {
      const auth = d.authors.map(n => {
        const parts = n.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];
        const last = parts[parts.length - 1];
        const initials = parts.slice(0, -1).map(p => p[0].toUpperCase() + '.').join(' ');
        return `${initials} ${last}`;
      }).join(', ');
      const pgPart = pg ? `, ${pg}` : '';
      const doiPart = doi ? ` (${doi})` : '';
      return `${auth}, ${d.title}. ${d.journalTitle} ${d.volume || ''}${pgPart} (${year}).${doiPart}`;
    }

    case 'AMS': {
      const auth = joinAuthors(d.authors, (n) => n, ', ', ', and ');
      const pgPart = pg ? `, pp. ${pg}` : '';
      const doiPart = doi ? `, DOI ${d.doi}` : '';
      return `${auth}, \\textit{${d.title}}, ${d.journalTitle} ${d.volume || ''} (${year})${pgPart}${doiPart}.`;
    }

    case 'BMJ': {
      const auth = d.authors.map(n => vancouverAuthor(n)).join(', ');
      const pgPart = pg ? `:${pg}` : '';
      const doiPart = doi ? ` doi:${d.doi}` : '';
      return `${auth}. ${d.title}. ${d.journalTitle} ${year};${d.volume || ''}${pgPart}.${doiPart}`;
    }

    case 'Springer': {
      const auth = joinAuthors(d.authors, (n) => apaAuthor(n));
      const pgPart = pg ? `, ${pg}` : '';
      const doiPart = doi ? `. ${doi}` : '';
      return `${auth} ${d.title}. ${d.journalTitle} ${d.volume || ''}${pgPart} (${year})${doiPart}`;
    }
  }
}

function citeKey(d: CitationData): string {
  const first = d.authors[0]?.split(/\s+/).pop() || 'unknown';
  return `${first}${getYear(d.publishDate)}`;
}

export function exportBibTeX(d: CitationData): string {
  const key = citeKey(d);
  const authors = d.authors.join(' and ');
  const pg = pages(d);
  let bib = `@article{${key},\n`;
  bib += `  author    = {${authors}},\n`;
  bib += `  title     = {${d.title}},\n`;
  bib += `  journal   = {${d.journalTitle}},\n`;
  bib += `  year      = {${getYear(d.publishDate)}},\n`;
  if (d.volume) bib += `  volume    = {${d.volume}},\n`;
  if (pg) bib += `  pages     = {${pg}},\n`;
  if (d.doi) bib += `  doi       = {${d.doi}},\n`;
  if (d.url) bib += `  url       = {${d.url}},\n`;
  bib += `}`;
  return bib;
}

export function exportRIS(d: CitationData): string {
  let ris = 'TY  - JOUR\n';
  d.authors.forEach(a => ris += `AU  - ${a}\n`);
  ris += `TI  - ${d.title}\n`;
  ris += `JO  - ${d.journalTitle}\n`;
  ris += `PY  - ${getYear(d.publishDate)}\n`;
  if (d.volume) ris += `VL  - ${d.volume}\n`;
  if (d.firstPage) ris += `SP  - ${d.firstPage}\n`;
  if (d.lastPage) ris += `EP  - ${d.lastPage}\n`;
  if (d.doi) ris += `DO  - ${d.doi}\n`;
  if (d.url) ris += `UR  - ${d.url}\n`;
  ris += 'ER  - \n';
  return ris;
}

export function exportCSLJSON(d: CitationData): string {
  const item = {
    type: 'article-journal',
    title: d.title,
    'container-title': d.journalTitle,
    author: d.authors.map(a => {
      const parts = a.trim().split(/\s+/);
      if (parts.length === 1) return { family: parts[0] };
      return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(' ') };
    }),
    issued: d.publishDate ? { 'date-parts': [[new Date(d.publishDate).getFullYear()]] } : undefined,
    volume: d.volume || undefined,
    page: pages(d) || undefined,
    DOI: d.doi || undefined,
    URL: d.url || undefined,
  };
  return JSON.stringify([item], null, 2);
}

export function exportEndNoteXML(d: CitationData): string {
  const year = getYear(d.publishDate);
  const authorsXml = d.authors.map(a => `        <author><style face="normal">${escXml(a)}</style></author>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<xml>
  <records>
    <record>
      <ref-type name="Journal Article">17</ref-type>
      <contributors>
        <authors>
${authorsXml}
        </authors>
      </contributors>
      <titles>
        <title><style face="normal">${escXml(d.title)}</style></title>
        <secondary-title><style face="normal">${escXml(d.journalTitle)}</style></secondary-title>
      </titles>
      <dates><year><style face="normal">${year}</style></year></dates>
${d.volume ? `      <volume><style face="normal">${escXml(d.volume)}</style></volume>\n` : ''}${pages(d) ? `      <pages><style face="normal">${escXml(pages(d))}</style></pages>\n` : ''}${d.doi ? `      <electronic-resource-num><style face="normal">${escXml(d.doi)}</style></electronic-resource-num>\n` : ''}    </record>
  </records>
</xml>`;
}

export function exportPlainText(d: CitationData): string {
  const pg = pages(d);
  let text = '';
  if (d.authors.length) text += `Authors: ${d.authors.join(', ')}\n`;
  text += `Title: ${d.title}\n`;
  text += `Journal: ${d.journalTitle}\n`;
  text += `Year: ${getYear(d.publishDate)}\n`;
  if (d.volume) text += `Volume: ${d.volume}\n`;
  if (pg) text += `Pages: ${pg}\n`;
  if (d.doi) text += `DOI: ${d.doi}\n`;
  if (d.url) text += `URL: ${d.url}\n`;
  return text;
}

export function exportCSV(d: CitationData): string {
  const pg = pages(d);
  const headers = 'Authors,Title,Journal,Year,Volume,Pages,DOI,URL';
  const row = [
    `"${d.authors.join('; ')}"`,
    `"${d.title.replace(/"/g, '""')}"`,
    `"${d.journalTitle}"`,
    getYear(d.publishDate),
    d.volume || '',
    pg,
    d.doi || '',
    d.url || '',
  ].join(',');
  return `${headers}\n${row}`;
}

export function exportMODSXML(d: CitationData): string {
  const year = getYear(d.publishDate);
  const authorsXml = d.authors.map(a => {
    const parts = a.trim().split(/\s+/);
    const family = parts.length > 1 ? parts[parts.length - 1] : a;
    const given = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
    return `    <name type="personal">
      <namePart type="family">${escXml(family)}</namePart>
      <namePart type="given">${escXml(given)}</namePart>
      <role><roleTerm type="text">author</roleTerm></role>
    </name>`;
  }).join('\n');
  const pg = pages(d);
  return `<?xml version="1.0" encoding="UTF-8"?>
<mods xmlns="http://www.loc.gov/mods/v3" version="3.8">
  <titleInfo><title>${escXml(d.title)}</title></titleInfo>
${authorsXml}
  <originInfo><dateIssued>${year}</dateIssued></originInfo>
  <relatedItem type="host">
    <titleInfo><title>${escXml(d.journalTitle)}</title></titleInfo>
    <part>
${d.volume ? `      <detail type="volume"><number>${escXml(d.volume)}</number></detail>\n` : ''}${pg ? `      <extent unit="pages"><start>${d.firstPage}</start><end>${d.lastPage}</end></extent>\n` : ''}    </part>
  </relatedItem>
${d.doi ? `  <identifier type="doi">${escXml(d.doi)}</identifier>\n` : ''}${d.url ? `  <location><url>${escXml(d.url)}</url></location>\n` : ''}</mods>`;
}

export function exportRefer(d: CitationData): string {
  let ref = '%0 Journal Article\n';
  d.authors.forEach(a => ref += `%A ${a}\n`);
  ref += `%T ${d.title}\n`;
  ref += `%J ${d.journalTitle}\n`;
  ref += `%D ${getYear(d.publishDate)}\n`;
  if (d.volume) ref += `%V ${d.volume}\n`;
  if (d.firstPage) ref += `%P ${pages(d)}\n`;
  if (d.doi) ref += `%R ${d.doi}\n`;
  if (d.url) ref += `%U ${d.url}\n`;
  return ref;
}

export function exportMARCXML(d: CitationData): string {
  const year = getYear(d.publishDate);
  const pg = pages(d);
  const authorsXml = d.authors.map((a, i) => {
    const tag = i === 0 ? '100' : '700';
    return `  <datafield tag="${tag}" ind1="1" ind2=" ">
    <subfield code="a">${escXml(a)}</subfield>
  </datafield>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<record xmlns="http://www.loc.gov/MARC21/slim" type="Bibliographic">
  <leader>     nab  22     4a 4500</leader>
  <datafield tag="245" ind1="1" ind2="0">
    <subfield code="a">${escXml(d.title)}</subfield>
  </datafield>
${authorsXml}
  <datafield tag="773" ind1="0" ind2=" ">
    <subfield code="t">${escXml(d.journalTitle)}</subfield>
${d.volume ? `    <subfield code="g">Vol. ${escXml(d.volume)}</subfield>\n` : ''}${pg ? `    <subfield code="q">${escXml(pg)}</subfield>\n` : ''}    <subfield code="d">${year}</subfield>
  </datafield>
${d.doi ? `  <datafield tag="024" ind1="7" ind2=" ">\n    <subfield code="a">${escXml(d.doi)}</subfield>\n    <subfield code="2">doi</subfield>\n  </datafield>\n` : ''}</record>`;
}

export function exportJATSXML(d: CitationData): string {
  const year = getYear(d.publishDate);
  const pg = pages(d);
  const authorsXml = d.authors.map(a => {
    const parts = a.trim().split(/\s+/);
    const family = parts.length > 1 ? parts[parts.length - 1] : a;
    const given = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
    return `        <name><surname>${escXml(family)}</surname><given-names>${escXml(given)}</given-names></name>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Publishing DTD v1.3 20210610//EN" "JATS-journalpublishing1-3.dtd">
<article article-type="research-article">
  <front>
    <journal-meta>
      <journal-title-group><journal-title>${escXml(d.journalTitle)}</journal-title></journal-title-group>
    </journal-meta>
    <article-meta>
      <title-group><article-title>${escXml(d.title)}</article-title></title-group>
      <contrib-group>
${authorsXml}
      </contrib-group>
      <pub-date pub-type="epub"><year>${year}</year></pub-date>
${d.volume ? `      <volume>${escXml(d.volume)}</volume>\n` : ''}${d.firstPage ? `      <fpage>${d.firstPage}</fpage>\n` : ''}${d.lastPage ? `      <lpage>${d.lastPage}</lpage>\n` : ''}${d.doi ? `      <article-id pub-id-type="doi">${escXml(d.doi)}</article-id>\n` : ''}    </article-meta>
  </front>
</article>`;
}

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
