/**
 * Sonic Speed HUD - Timer Logic (Refactored Ultra-Clean Version)
 * Inspired by the 1991 Sonic the Hedgehog "Drowning" Stress.
 */
class SonicTimer {
    constructor(duration, containerId) {
        this.duration = duration;
        this.element = document.getElementById(containerId);
        this.running = false;
        this.startTime = null;
        this.frameReq = null;
        this.lastIntSeconds = null;
        this.goalSoundTriggered = false;

        this.els = {
            seconds: document.getElementById('seconds'),
            circle: document.getElementById('progress-circle'),
            status: document.getElementById('status-text'),
            body: document.body,
            music: document.getElementById('bg-music'),
            goalSfx: document.getElementById('goal-sfx'),
            card: document.getElementById('timer-card'),
            retryBtn: document.getElementById('retry-btn')
        };

        this.init();
    }

    init() {
        const radius = this.els.circle.r.baseVal.value;
        this.circumference = radius * 2 * Math.PI;
        this.els.circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        
        this.setProgress(100);
        this.updateDisplay(this.duration);

        // UI Listeners
        document.getElementById('toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            this.els.card.classList.toggle('wide');
        });

        this.els.retryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.reset();
            this.start();
        });

        // Gesture Handling (Full Card Area)
        const mc = new Hammer(this.els.card);
        mc.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL });

        mc.on('panup pandown', (ev) => {
            if (!this.running) {
                const delta = ev.direction === Hammer.DIRECTION_UP ? 1000 : -1000;
                this.duration = Math.max(1000, Math.min(999000, this.duration + delta));
                this.updateDisplay(this.duration);
                this.setProgress(100);
            }
        });

        mc.on('tap', (ev) => {
            if (ev.target.tagName.toLowerCase() === 'button') return;
            this.running ? this.reset() : this.start();
        });
    }

    setProgress(percent) {
        const offset = this.circumference - (percent / 100 * this.circumference);
        this.els.circle.style.strokeDashoffset = offset;
    }

    updateDisplay(ms) {
        const seconds = Math.ceil(ms / 1000);
        if (seconds === this.lastIntSeconds) return;

        this.els.seconds.textContent = seconds;
        this.lastIntSeconds = seconds;

        if (this.running) {
            this.els.body.classList.remove('stress-level-1', 'stress-level-2');
            if (seconds <= 5) this.els.body.classList.add('stress-level-2');
            else if (seconds <= 10) this.els.body.classList.add('stress-level-1');
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.startTime = performance.now();
        this.lastIntSeconds = null;
        this.goalSoundTriggered = false;
        
        this.els.status.textContent = "ACTIVE";
        this.els.body.classList.add('running');
        this.els.body.classList.remove('countdown--ended');
        this.element.classList.remove('countdown--ended');

        this.els.goalSfx?.pause();
        if (this.els.music) {
            this.els.music.currentTime = 0;
            this.els.music.loop = true;
            this.els.music.volume = 1;
            this.els.music.play().catch(() => {});
        }

        const frame = (now) => {
            const elapsed = now - this.startTime;
            const remaining = Math.max(0, this.duration - elapsed);
            
            this.updateDisplay(remaining);
            this.setProgress((remaining / this.duration) * 100);

            // 100ms Latency Compensation
            if (remaining <= 100 && !this.goalSoundTriggered) {
                this.goalSoundTriggered = true;
                this.complete(true);
            }

            if (remaining > 0) {
                this.frameReq = requestAnimationFrame(frame);
            } else {
                this.complete(false);
            }
        };
        this.frameReq = requestAnimationFrame(frame);
    }

    reset() {
        this.running = false;
        cancelAnimationFrame(this.frameReq);
        this.els.status.textContent = "IDLE";
        this.els.body.classList.remove('running', 'stress-level-1', 'stress-level-2', 'countdown--ended');
        this.element.classList.remove('countdown--ended');
        this.lastIntSeconds = null;
        this.updateDisplay(this.duration);
        this.setProgress(100);
        
        if (this.els.music) {
            this.els.music.pause();
            this.els.music.currentTime = 0;
        }
    }

    complete(isEarly = false) {
        if (!isEarly) {
            this.running = false;
            cancelAnimationFrame(this.frameReq);
            this.els.status.textContent = "DROWNED!";
            this.els.body.classList.add('countdown--ended');
            this.element.classList.add('countdown--ended');
            this.setProgress(0);
            this.updateDisplay(0);
        }
        
        if (isEarly || !this.goalSoundTriggered) {
            if (this.els.music) {
                this.els.music.pause();
                this.els.music.loop = false;
                this.els.music.volume = 0;
            }
            if (this.els.goalSfx) {
                this.els.goalSfx.currentTime = 0;
                this.els.goalSfx.play().catch(() => {});
            }
            this.goalSoundTriggered = true;
        }
    }
}

const timer = new SonicTimer(12000, 'countdown');
