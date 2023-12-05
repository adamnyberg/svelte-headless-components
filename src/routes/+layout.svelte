<script>
  import '../app.css';
  import 'highlight.js/styles/github-dark.css';

  import hljs from 'highlight.js/lib/core';
  import typescript from 'highlight.js/lib/languages/typescript';
  import { storeHighlightJs } from '@skeletonlabs/skeleton';

  hljs.registerLanguage('typescript', typescript);
  storeHighlightJs.set(hljs);
</script>

<slot />
