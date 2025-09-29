# 🚀 Como Fazer Deploy na Netlify

## Método 1: Drag & Drop (Mais Fácil)

### Passo 1: Baixar os Arquivos
1. Execute `npm run build` (já foi executado)
2. A pasta `dist/` contém todos os arquivos prontos para deploy

### Passo 2: Deploy na Netlify
1. Acesse [netlify.com](https://netlify.com)
2. Faça login ou crie uma conta gratuita
3. Na dashboard, arraste a pasta `dist/` para a área "Want to deploy a new site without connecting to Git?"
4. Aguarde o upload terminar
5. Pronto! Seu site estará online

## Método 2: Via Git (Recomendado para atualizações)

### Passo 1: Subir para GitHub
1. Crie um repositório no GitHub
2. Faça push do projeto completo

### Passo 2: Conectar na Netlify
1. Na Netlify, clique em "New site from Git"
2. Conecte com GitHub
3. Selecione seu repositório
4. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18
5. Deploy!

## ⚙️ Configurações Importantes

O projeto já tem:
- ✅ `netlify.toml` configurado
- ✅ Build command correto
- ✅ Redirects para SPA
- ✅ Node.js 18 especificado

## 📱 Atualizações Futuras

Para atualizar o cardápio:
1. Modifique o `public/config.json`
2. Se usando Git: faça commit e push
3. Se usando drag & drop: faça novo build e arraste novamente

## 🔗 Links Úteis

- [Netlify Dashboard](https://app.netlify.com)
- [Documentação Netlify](https://docs.netlify.com)
- [GitHub](https://github.com)