/**
 * audio.js - Motor sintetizador de sirena táctica autónoma
 * Suena exactamente 5 segundos al inicio y repite 5 segundos cada 5 minutos
 */
class MotorAudioC4 {
  constructor() {
    this.contextoAudio = null;
    this.oscilador = null;
    this.nodoGanancia = null;
    this.sonando = false;
  }

  iniciarContexto() {
    if (!this.contextoAudio) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.contextoAudio = new AudioCtx();
    }
    if (this.contextoAudio.state === 'suspended') {
      this.contextoAudio.resume();
    }
  }

  sonarSirenaTactico(duracionSegundos = 5) {
    if (this.sonando) return;
    this.iniciarContexto();

    this.sonando = true;
    const ahora = this.contextoAudio.currentTime;

    this.oscilador = this.contextoAudio.createOscillator();
    this.nodoGanancia = this.contextoAudio.createGain();

    this.oscilador.type = 'sawtooth';
    
    // Modulación bitonal de alta penetración
    this.oscilador.frequency.setValueAtTime(850, ahora);
    for (let i = 0; i < duracionSegundos; i += 0.5) {
      this.oscilador.frequency.setValueAtTime(850, ahora + i);
      this.oscilador.frequency.setValueAtTime(1200, ahora + i + 0.25);
    }

    this.nodoGanancia.gain.setValueAtTime(0.25, ahora);
    this.nodoGanancia.gain.exponentialRampToValueAtTime(0.001, ahora + duracionSegundos);

    this.oscilador.connect(this.nodoGanancia);
    this.nodoGanancia.connect(this.contextoAudio.destination);

    this.oscilador.start(ahora);
    this.oscilador.stop(ahora + duracionSegundos);

    setTimeout(() => {
      this.sonando = false;
    }, duracionSegundos * 1000);
  }
}

const motorAudio = new MotorAudioC4();
// Preactivación al primer clic en cualquier parte de la pantalla
document.addEventListener('click', () => motorAudio.iniciarContexto(), { once: true });