import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
  animations: [
    trigger('heroTitle', [
      transition(':enter', [
        query('.word', [
          style({ opacity: 0, transform: 'translateY(110%) rotateX(-30deg)' }),
          stagger(100, [
            animate(
              '900ms cubic-bezier(0.16, 1, 0.3, 1)',
              style({ opacity: 1, transform: 'translateY(0) rotateX(0)' })
            ),
          ]),
        ], { optional: true }),
      ]),
    ]),
    trigger('fadeSlideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(32px)' }),
        animate('700ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms ease', style({ opacity: 1 })),
      ]),
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.85)' }),
        animate('800ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
    trigger('staggerCards', [
      transition(':enter', [
        query('.skill-card', [
          style({ opacity: 0, transform: 'translateY(40px)' }),
          stagger(80, [
            animate('600ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
  ],
})
export class HomepageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cursorDot') cursorDot!: ElementRef<HTMLDivElement>;
  @ViewChild('cursorRing') cursorRing!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // State
  isLoaded = false;
  showContent = false;
  loaderProgress = 0;
  activeSection = 'hero';
  mobileMenuOpen = false;
  hoveredWork = -1;

  // Cursor
  private mouseX = 0;
  private mouseY = 0;
  private ringX = 0;
  private ringY = 0;
  private rafId = 0;

  // Canvas particles
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animFrameId = 0;

  // Data
  navLinks = [
    { label: 'Work', href: '#work' },
    { label: 'About', href: '#about' },
    { label: 'Process', href: '#process' },
    { label: 'Contact', href: '#contact' },
  ];

  titleWords = ['Crafting', 'Experiences', 'That', 'Feel', 'Inevitable.'];

  skills = [
    { icon: '◈', name: 'User Research', desc: 'Deep ethnographic research, usability studies, and synthesis frameworks that uncover real user needs.' },
    { icon: '⬡', name: 'UI Design', desc: 'High-fidelity interfaces with obsessive attention to typography, spacing, and visual hierarchy.' },
    { icon: '◉', name: 'Prototyping', desc: 'Interactive Figma prototypes and coded proof-of-concepts that communicate intent precisely.' },
    { icon: '⬔', name: 'Design Systems', desc: 'Scalable component libraries and design tokens that keep teams aligned at any size.' },
    { icon: '◐', name: 'Motion Design', desc: 'Purposeful animation and micro-interactions that guide attention and communicate state.' },
    { icon: '◑', name: 'UX Strategy', desc: 'Information architecture, user flows, and product thinking that align business with human needs.' },
  ];

  works = [
    {
      num: '01',
      name: 'Orbit Finance',
      type: 'Product Design · Mobile',
      year: '2025',
      color: '#c8ff47',
      desc: 'Redesigned onboarding flow — 3× signup conversion',
    },
    {
      num: '02',
      name: 'Grove Community',
      type: 'UI Design · Web App',
      year: '2024',
      color: '#47d4ff',
      desc: 'Creator platform serving 200k+ active users',
    },
    {
      num: '03',
      name: 'Voxel AI Studio',
      type: 'Design System · SaaS',
      year: '2024',
      color: '#ff8447',
      desc: '280-component system across 5 product teams',
    },
    {
      num: '04',
      name: 'Pulse Health',
      type: 'UX Research · Mobile',
      year: '2023',
      color: '#ff47a0',
      desc: 'Zero-to-one health tracking app, 4.9★ App Store',
    },
  ];

  processSteps = [
    { num: '01', title: 'Discover', desc: 'Stakeholder interviews, competitive audits, user research, and synthesis to define the real problem worth solving.' },
    { num: '02', title: 'Define', desc: 'User personas, journey maps, and clear design principles that become the north star for every decision ahead.' },
    { num: '03', title: 'Design', desc: 'Wireframes → high-fidelity mockups → interactive prototypes. Iteration is the work, not the obstacle.' },
    { num: '04', title: 'Deliver', desc: 'Dev handoff with annotated specs, design tokens, and motion guidelines. I stay involved through launch and beyond.' },
  ];

  stats = [
    { value: '5+', label: 'Years of Practice' },
    { value: '40+', label: 'Projects Shipped' },
    { value: '12', label: 'Awards & Features' },
    { value: '98%', label: 'Client Satisfaction' },
  ];

  visibleSections = new Set<string>();

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.runLoader();
  }

  ngAfterViewInit(): void {
    this.startCursorLoop();
    this.initScrollObserver();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    cancelAnimationFrame(this.animFrameId);
  }

  // ─── LOADER ────────────────────────────────────────────────────────────────
  private runLoader(): void {
    const interval = setInterval(() => {
      this.loaderProgress += Math.random() * 18 + 4;
      if (this.loaderProgress >= 100) {
        this.loaderProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          this.isLoaded = true;
          setTimeout(() => (this.showContent = true), 400);
        }, 300);
      }
    }, 80);
  }

  // ─── CURSOR ─────────────────────────────────────────────────────────────────
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    if (this.cursorDot?.nativeElement) {
      this.cursorDot.nativeElement.style.left = `${this.mouseX}px`;
      this.cursorDot.nativeElement.style.top = `${this.mouseY}px`;
    }
  }

  private startCursorLoop(): void {
    const loop = () => {
      this.ringX += (this.mouseX - this.ringX) * 0.30;
      this.ringY += (this.mouseY - this.ringY) * 0.30;
      if (this.cursorRing?.nativeElement) {
        this.cursorRing.nativeElement.style.left = `${this.ringX}px`;
        this.cursorRing.nativeElement.style.top = `${this.ringY}px`;
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.ngZone.runOutsideAngular(() => loop());
  }

  onHoverIn(): void {
    if (this.cursorDot?.nativeElement) this.cursorDot.nativeElement.classList.add('hovered');
    if (this.cursorRing?.nativeElement) this.cursorRing.nativeElement.classList.add('hovered');
  }

  onHoverOut(): void {
    if (this.cursorDot?.nativeElement) this.cursorDot.nativeElement.classList.remove('hovered');
    if (this.cursorRing?.nativeElement) this.cursorRing.nativeElement.classList.remove('hovered');
  }


 

  // ─── SCROLL OBSERVER ────────────────────────────────────────────────────────
  private initScrollObserver(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        this.ngZone.run(() => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              this.visibleSections.add(e.target.id);
            }
          });
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll('section[id]').forEach((s) => observer.observe(s));
  }

  isSectionVisible(id: string): boolean {
    return this.visibleSections.has(id);
  }

  // ─── MISC ───────────────────────────────────────────────────────────────────
  scrollTo(href: string): void {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    this.mobileMenuOpen = false;
  }

  setHoveredWork(index: number): void {
    this.hoveredWork = index;
  }

  trackByIndex(index: number): number {
    return index;
  }
}

interface Particle {
  x: number;
  y: number;
  r: number;
  dx: number;
  dy: number;
  alpha: number;
}
