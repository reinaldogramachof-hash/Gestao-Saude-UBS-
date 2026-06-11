/**
 * HOOK: usePWAInstall.js
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Captura o evento nativo do browser que sinaliza que o app pode ser
 *         instalado como PWA (adicionado à tela inicial).
 *
 * COMO FUNCIONA:
 *   O browser dispara o evento 'beforeinstallprompt' quando detecta que:
 *   - O site tem um manifest.json válido
 *   - O service worker está registrado
 *   - O usuário interagiu com o site por algum tempo
 *   - O app ainda não foi instalado neste dispositivo
 *
 *   Este hook captura e "congela" esse evento para ser acionado manualmente
 *   por um botão — em vez de aparecer automaticamente pelo browser.
 *
 * RETORNO:
 *   - podeInstalar: boolean — true quando o browser liberou o prompt de instalação
 *   - instalar: função — chama o prompt nativo de instalação ao ser clicada
 *   - jaInstalado: boolean — true quando o app já foi instalado (modo standalone)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';

export function usePWAInstall() {
  // Armazena o evento do browser para acionar manualmente depois
  const [eventoInstalacao, setEventoInstalacao] = useState(null);
  const [podeInstalar, setPodeInstalar]         = useState(false);

  // Detecta se o app já está rodando em modo standalone (já instalado)
  const jaInstalado = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true; // iOS Safari

  useEffect(() => {
    // Se já está instalado, não precisa capturar o evento
    if (jaInstalado) return;

    const capturarEvento = (e) => {
      // Impede o banner automático do browser — queremos controlar quando aparece
      e.preventDefault();
      setEventoInstalacao(e);
      setPodeInstalar(true);
    };

    window.addEventListener('beforeinstallprompt', capturarEvento);

    // Quando o usuário instala pelo banner nativo do browser, desativa o botão
    window.addEventListener('appinstalled', () => {
      setPodeInstalar(false);
      setEventoInstalacao(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', capturarEvento);
    };
  }, [jaInstalado]);

  // Aciona o prompt nativo de instalação do browser
  const instalar = async () => {
    if (!eventoInstalacao) return;

    eventoInstalacao.prompt(); // Exibe o diálogo nativo "Adicionar à tela inicial"

    const { outcome } = await eventoInstalacao.userChoice;
    if (outcome === 'accepted') {
      setPodeInstalar(false);
      setEventoInstalacao(null);
    }
  };

  return { podeInstalar, instalar, jaInstalado };
}
