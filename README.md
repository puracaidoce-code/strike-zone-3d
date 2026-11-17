# STRIKE ZONE 3D WEB

Protótipo FPS 3D para navegador mobile, construído com Three.js/WebGL.

## Requisitos
- Android com navegador moderno e WebGL habilitado.
- Internet na primeira abertura para carregar Three.js do CDN.
- Para hospedar, use GitHub Pages, Netlify ou outro host estático HTTPS.
- Também é possível abrir via servidor local no Termux, mas abrir `index.html` como `file://` pode bloquear módulos ES.

## Publicar gratuitamente pelo celular (GitHub Pages)
1. Crie uma conta ou entre em https://github.com.
2. Crie um repositório público chamado `strike-zone-web`.
3. Envie todos os arquivos e pastas deste ZIP mantendo a estrutura.
4. Em Settings → Pages, escolha Deploy from a branch.
5. Selecione `main` e `/root`, salve.
6. Abra o endereço Pages que o GitHub mostrar.

Alternativa: Netlify Drop em https://app.netlify.com/drop, enviando a pasta extraída pelo navegador. Se o envio de pasta não funcionar no Android, use GitHub.

## Controles
- Mobile: joystick esquerdo para mover, arraste no lado direito para olhar, botão FIRE para atirar, ↻ para recarregar.
- Desktop: WASD/setas para mover, mouse/touchpad não implementado, Space para disparar, R recarrega, Esc pausa.

## Escopo
Este é um protótipo jogável inicial. A arena, bots e arma são formas procedurais. Não inclui modelos/sons finais, bomba plantável, multiplayer ou bots com táticas avançadas. A IA é básica e o sistema de colisão é simplificado.
