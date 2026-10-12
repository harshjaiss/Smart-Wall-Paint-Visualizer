/* ==========================================================================
   Smart Wall Paint Visualizer - Angular 15+ Standalone Component
   ========================================================================== */

import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

interface Point {
  x: number;
  y: number;
}

type PaintFinish = "matte" | "satin" | "gloss" | "metallic";

interface Wall {
  id: number;
  points: Point[];
  color: string;
  finish: PaintFinish;
  opacity: number;
  blendMode: "multiply" | "overlay";
}

interface PaintColor {
  name: string;
  hex: string;
  category: "neutral" | "blue" | "green" | "warm";
}

@Component({
  selector: "app-smart-wall-paint",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-wrapper">
      <!-- Navbar -->
      <nav class="navbar">
        <div class="nav-container">
          <div class="brand">
            <div class="brand-icon"><i class="fas fa-paint-roller"></i></div>
            <div>
              <span class="brand-title">Smart Wall Paint Visualizer</span>
              <span class="brand-subtitle"
                >MEAN Stack Interior Preview Solution</span
              >
            </div>
          </div>
          <div class="nav-actions">
            <button class="btn btn-outline btn-sm" (click)="openLoadModal()">
              <i class="fas fa-folder-open"></i> Load Project
            </button>
            <button class="btn btn-primary btn-sm" (click)="openSaveModal()">
              <i class="fas fa-save"></i> Save Project
            </button>
          </div>
        </div>
      </nav>

      <!-- Workspace Container -->
      <div class="workspace-container">
        <!-- Left Panel: Presets & Color Palette -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title"
              ><i class="fas fa-palette"></i> Paint & Room Selection</span
            >
          </div>
          <div class="panel-body">
            <!-- Room Presets & Upload -->
            <div class="section-title">Select Room Preset</div>
            <div class="presets-grid">
              <div
                *ngFor="let src of presetImages; let i = index"
                class="preset-thumb"
                [class.active]="imageSrc === src"
                (click)="selectPreset(src)"
              >
                <img [src]="src" alt="Preset Room" />
              </div>
            </div>

            <div class="upload-box" (click)="fileInput.click()">
              <div class="upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
              </div>
              <div style="font-size: 0.85rem; font-weight: 600;">
                Upload Your Room Photo
              </div>
              <span style="font-size: 0.7rem; color: var(--gray-500);"
                >Supports JPG, PNG</span
              >
              <input
                #fileInput
                type="file"
                accept="image/*"
                style="display: none;"
                (change)="onFileUploaded($event)"
              />
            </div>

            <hr
              style="border: none; border-top: 1px solid var(--gray-200); margin: 0.5rem 0;"
            />

            <!-- Color Categories & Swatches -->
            <div class="section-title">Choose Paint Color</div>
            <div class="color-categories">
              <button
                *ngFor="let cat of ['all', 'neutral', 'blue', 'green', 'warm']"
                class="category-pill"
                [class.active]="activeCategory === cat"
                (click)="activeCategory = cat"
              >
                {{ cat | titlecase }}
              </button>
            </div>

            <div class="color-grid">
              <div
                *ngFor="let color of filteredColors"
                class="color-card"
                [class.active]="selectedColor.hex === color.hex"
                [style.background-color]="color.hex"
                (click)="selectColor(color)"
              >
                <span class="color-card-name">{{ color.name }}</span>
              </div>
            </div>

            <!-- Finish Selection -->
            <div class="section-title" style="margin-top: 0.5rem;">
              Finish Type
            </div>
            <div class="finish-options">
              <div
                *ngFor="let finish of ['matte', 'satin', 'gloss', 'metallic']"
                class="finish-card"
                [class.active]="selectedFinish === finish"
                (click)="selectFinish($any(finish))"
              >
                <span style="text-transform: capitalize; font-size: 0.8rem;">{{
                  finish
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Center Stage: Canvas Visualizer -->
        <div class="canvas-workspace">
          <div class="canvas-toolbar">
            <div class="tool-group">
              <button
                class="tool-btn"
                [class.active]="activeTool === 'select'"
                (click)="setTool('select')"
              >
                <i class="fas fa-mouse-pointer"></i> Select / View
              </button>
              <button
                class="tool-btn"
                [class.active]="activeTool === 'polygon'"
                (click)="setTool('polygon')"
              >
                <i class="fas fa-draw-polygon"></i> Draw Wall Mask
              </button>
            </div>
            <div class="tool-group">
              <button
                class="tool-btn"
                style="color: var(--danger);"
                (click)="resetWalls()"
              >
                <i class="fas fa-trash"></i> Clear Walls
              </button>
            </div>
          </div>

          <div class="canvas-viewport">
            <div
              *ngIf="activeTool === 'polygon'"
              class="canvas-overlay-instruction"
            >
              <i class="fas fa-info-circle"></i> Click points around the wall.
              Double-click or click start point to finish.
            </div>
            <canvas
              #roomCanvas
              (click)="onCanvasClick($event)"
              (dblclick)="onCanvasDblClick()"
            >
            </canvas>
          </div>
        </div>

        <!-- Right Panel: Cost & Coverage Estimator -->
        <div class="panel estimator-panel">
          <div class="panel-header">
            <span class="panel-title"
              ><i class="fas fa-calculator"></i> Estimator & Summary</span
            >
          </div>
          <div class="panel-body">
            <div class="input-group">
              <label>Room Width (ft)</label>
              <input
                type="number"
                [(ngModel)]="roomDimensions.width"
                (input)="updateEstimator()"
              />
            </div>

            <div class="input-group">
              <label>Room Height (ft)</label>
              <input
                type="number"
                [(ngModel)]="roomDimensions.height"
                (input)="updateEstimator()"
              />
            </div>

            <div class="input-group">
              <label>Room Length (ft)</label>
              <input
                type="number"
                [(ngModel)]="roomDimensions.length"
                (input)="updateEstimator()"
              />
            </div>

            <div
              style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;"
            >
              <div class="input-group">
                <label>Doors</label>
                <input
                  type="number"
                  [(ngModel)]="roomDimensions.doors"
                  (input)="updateEstimator()"
                />
              </div>
              <div class="input-group">
                <label>Windows</label>
                <input
                  type="number"
                  [(ngModel)]="roomDimensions.windows"
                  (input)="updateEstimator()"
                />
              </div>
            </div>

            <div class="input-group">
              <label>Paint Price ($ / Gallon)</label>
              <input
                type="number"
                [(ngModel)]="paintPricePerGallon"
                (input)="updateEstimator()"
              />
            </div>

            <div class="estimate-summary">
              <div class="estimate-row">
                <span>Net Wall Area:</span>
                <strong>{{ netArea }} sq ft</strong>
              </div>
              <div class="estimate-row">
                <span>Estimated Gallons:</span>
                <strong>{{ gallonsNeeded }} gal</strong>
              </div>
              <div class="estimate-row total">
                <span>Estimated Cost:</span>
                <span style="color: var(--primary);">\${{ totalCost }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Modal -->
      <div class="modal-backdrop" [class.open]="isSaveModalOpen">
        <div class="modal-card">
          <div class="modal-header">
            <strong>Save Room Project</strong>
            <button
              class="btn btn-icon btn-sm"
              (click)="isSaveModalOpen = false"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="input-group">
              <label>Project Name</label>
              <input
                type="text"
                [(ngModel)]="projectTitleToSave"
                placeholder="e.g. Modern Living Room"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-outline btn-sm"
              (click)="isSaveModalOpen = false"
            >
              Cancel
            </button>
            <button
              class="btn btn-primary btn-sm"
              (click)="confirmSaveProject()"
            >
              Save to MEAN DB
            </button>
          </div>
        </div>
      </div>

      <!-- Load Modal -->
      <div class="modal-backdrop" [class.open]="isLoadModalOpen">
        <div class="modal-card">
          <div class="modal-header">
            <strong>Load Saved Projects</strong>
            <button
              class="btn btn-icon btn-sm"
              (click)="isLoadModalOpen = false"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div
              *ngIf="savedProjects.length === 0"
              style="color: var(--gray-500); text-align: center; font-size: 0.85rem;"
            >
              No saved projects found.
            </div>
            <div
              *ngFor="let proj of savedProjects"
              style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border: 1px solid var(--gray-200); border-radius: var(--radius); margin-bottom: 0.5rem;"
            >
              <div>
                <strong>{{ proj.title }}</strong>
                <span
                  style="display: block; font-size: 0.75rem; color: var(--gray-500);"
                  >Saved on {{ proj.date }}</span
                >
              </div>
              <button
                class="btn btn-primary btn-sm"
                (click)="loadProject(proj)"
              >
                Load
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-outline btn-sm"
              (click)="isLoadModalOpen = false"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Scoped or shared styles */
      .app-wrapper {
        font-family: "Inter", sans-serif;
        background-color: var(--gray-50, #f8fafc);
        color: var(--gray-900, #0f172a);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class SmartWallPaintComponent implements OnInit, AfterViewInit {
  @ViewChild("roomCanvas", { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  imageSrc =
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80";
  originalImage: HTMLImageElement | null = null;

  presetImages = [
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  ];

  paintPalette: PaintColor[] = [
    { name: "Cashmere Cream", hex: "#EBE5D8", category: "neutral" },
    { name: "Warm Taupe", hex: "#C8B7A6", category: "neutral" },
    { name: "Ocean Mist", hex: "#BAE6FD", category: "blue" },
    { name: "Deep Indigo", hex: "#1E3A8A", category: "blue" },
    { name: "Sage Green", hex: "#A7F3D0", category: "green" },
    { name: "Olive Grove", hex: "#3F6212", category: "green" },
    { name: "Terracotta", hex: "#F87171", category: "warm" },
    { name: "Sunlit Amber", hex: "#FBBF24", category: "warm" },
  ];

  activeCategory = "all";
  selectedColor: PaintColor = this.paintPalette[0];
  selectedFinish: PaintFinish = "matte";

  activeTool: "select" | "polygon" = "select";
  currentPolygonPoints: Point[] = [];
  walls: Wall[] = [];
  activeWallId: number | null = null;

  roomDimensions = { width: 12, height: 9, length: 14, doors: 1, windows: 2 };
  paintPricePerGallon = 45.0;
  netArea = 0;
  gallonsNeeded = 0;
  totalCost = 0;

  isSaveModalOpen = false;
  isLoadModalOpen = false;
  projectTitleToSave = "";
  savedProjects: any[] = [];

  ngOnInit() {
    this.updateEstimator();
  }

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext("2d")!;
    this.loadImage(this.imageSrc);
  }

  get filteredColors() {
    return this.activeCategory === "all"
      ? this.paintPalette
      : this.paintPalette.filter((c) => c.category === this.activeCategory);
  }

  loadImage(src: string) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      this.originalImage = img;
      const canvas = this.canvasRef.nativeElement;
      canvas.width = img.naturalWidth || 1200;
      canvas.height = img.naturalHeight || 800;
      this.redrawCanvas();
    };
    img.src = src;
  }

  selectPreset(src: string) {
    this.imageSrc = src;
    this.walls = [];
    this.loadImage(src);
  }

  onFileUploaded(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imageSrc = e.target.result;
      this.walls = [];
      this.loadImage(this.imageSrc);
    };
    reader.readAsDataURL(file);
  }

  setTool(tool: "select" | "polygon") {
    this.activeTool = tool;
    if (tool === "polygon") {
      this.currentPolygonPoints = [];
    }
    this.redrawCanvas();
  }

  selectColor(color: PaintColor) {
    this.selectedColor = color;
    if (this.activeWallId) {
      const wall = this.walls.find((w) => w.id === this.activeWallId);
      if (wall) {
        wall.color = color.hex;
        this.redrawCanvas();
      }
    }
  }

  selectFinish(finish: PaintFinish) {
    this.selectedFinish = finish;
    if (this.activeWallId) {
      const wall = this.walls.find((w) => w.id === this.activeWallId);
      if (wall) {
        wall.finish = finish;
        wall.blendMode = finish === "gloss" ? "overlay" : "multiply";
        wall.opacity = finish === "matte" ? 0.8 : 0.7;
        this.redrawCanvas();
      }
    }
  }

  onCanvasClick(event: MouseEvent) {
    if (this.activeTool !== "polygon") return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    if (this.currentPolygonPoints.length >= 2) {
      const dist = Math.hypot(
        this.currentPolygonPoints[0].x - x,
        this.currentPolygonPoints[0].y - y,
      );
      if (dist < 25) {
        this.completePolygon();
        return;
      }
    }

    this.currentPolygonPoints.push({ x, y });
    this.redrawCanvas();
  }

  onCanvasDblClick() {
    if (
      this.activeTool === "polygon" &&
      this.currentPolygonPoints.length >= 3
    ) {
      this.completePolygon();
    }
  }

  completePolygon() {
    const newWall: Wall = {
      id: Date.now(),
      points: [...this.currentPolygonPoints],
      color: this.selectedColor.hex,
      finish: this.selectedFinish,
      opacity: this.selectedFinish === "matte" ? 0.8 : 0.7,
      blendMode: this.selectedFinish === "gloss" ? "overlay" : "multiply",
    };
    this.walls.push(newWall);
    this.activeWallId = newWall.id;
    this.currentPolygonPoints = [];
    this.activeTool = "select";
    this.redrawCanvas();
  }

  resetWalls() {
    this.walls = [];
    this.activeWallId = null;
    this.redrawCanvas();
  }

  redrawCanvas() {
    if (!this.ctx || !this.originalImage) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);

    this.walls.forEach((wall) => {
      if (wall.points.length < 3) return;
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(wall.points[0].x, wall.points[0].y);
      wall.points.forEach((p) => this.ctx.lineTo(p.x, p.y));
      this.ctx.closePath();

      this.ctx.fillStyle = wall.color;
      this.ctx.globalAlpha = wall.opacity;
      this.ctx.globalCompositeOperation = wall.blendMode;
      this.ctx.fill();
      this.ctx.restore();
    });

    if (this.activeTool === "polygon" && this.currentPolygonPoints.length > 0) {
      this.ctx.save();
      this.ctx.strokeStyle = "#0ea5e9";
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(
        this.currentPolygonPoints[0].x,
        this.currentPolygonPoints[0].y,
      );
      this.currentPolygonPoints.forEach((p) => this.ctx.lineTo(p.x, p.y));
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  updateEstimator() {
    const { width, height, length, doors, windows } = this.roomDimensions;
    const grossArea = 2 * (width + length) * height;
    const deductions = doors * 21 + windows * 15;
    this.netArea = Math.max(0, grossArea - deductions);
    this.gallonsNeeded = Math.ceil((this.netArea / 350) * 10) / 10;
    this.totalCost = Math.ceil(this.gallonsNeeded * this.paintPricePerGallon);
  }

  openSaveModal() {
    this.isSaveModalOpen = true;
  }
  openLoadModal() {
    this.isLoadModalOpen = true;
  }

  confirmSaveProject() {
    const proj = {
      id: Date.now(),
      title: this.projectTitleToSave || "My Room Design",
      date: new Date().toLocaleDateString(),
      imageSrc: this.imageSrc,
      walls: [...this.walls],
    };
    this.savedProjects.push(proj);
    this.isSaveModalOpen = false;
    this.projectTitleToSave = "";
  }

  loadProject(proj: any) {
    this.imageSrc = proj.imageSrc;
    this.walls = [...proj.walls];
    this.loadImage(this.imageSrc);
    this.isLoadModalOpen = false;
  }
}
