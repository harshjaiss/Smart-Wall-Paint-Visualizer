/* ==========================================================================
   Smart Wall Paint Visualizer - Complete TypeScript Code & Models
   ========================================================================== */

export interface Point {
  x: number;
  y: number;
}

export type PaintFinish = "matte" | "satin" | "gloss" | "metallic";

export type BlendMode = "multiply" | "overlay";

export interface Wall {
  id: number;
  points: Point[];
  color: string;
  finish: PaintFinish;
  opacity: number;
  blendMode: BlendMode;
}

export interface PaintColor {
  name: string;
  hex: string;
  category: "neutral" | "blue" | "green" | "warm";
}

export interface RoomDimensions {
  width: number;
  height: number;
  length: number;
  doors: number;
  windows: number;
}

export interface SavedProject {
  id: number;
  title: string;
  date: string;
  imageSrc: string;
  walls: Wall[];
}

export class SmartWallPaintVisualizerApp {
  public imageSrc: string =
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80";
  public originalImage: HTMLImageElement | null = null;
  public walls: Wall[] = [];
  public activeWallId: number | null = null;
  public activeTool: "select" | "polygon" | "pan" = "select";
  public currentPolygonPoints: Point[] = [];

  public selectedColor: PaintColor = {
    name: "Cashmere Cream",
    hex: "#EBE5D8",
    category: "neutral",
  };
  public selectedFinish: PaintFinish = "matte";

  public roomDimensions: RoomDimensions = {
    width: 12,
    height: 9,
    length: 14,
    doors: 1,
    windows: 2,
  };
  public paintPricePerGallon: number = 45.0;
  public savedProjects: SavedProject[] = [];

  constructor() {}

  public loadPresetImage(src: string): void {
    this.imageSrc = src;
    this.walls = [];
    this.activeWallId = null;
  }

  public addPolygonPoint(point: Point): void {
    if (this.activeTool !== "polygon") return;
    this.currentPolygonPoints.push(point);
  }

  public completePolygonWall(): Wall | null {
    if (this.currentPolygonPoints.length < 3) return null;

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
    return newWall;
  }

  public updateActiveWallColor(hex: string): void {
    if (!this.activeWallId) return;
    const wall = this.walls.find((w) => w.id === this.activeWallId);
    if (wall) {
      wall.color = hex;
    }
  }

  public updateActiveWallFinish(finish: PaintFinish): void {
    this.selectedFinish = finish;
    if (!this.activeWallId) return;
    const wall = this.walls.find((w) => w.id === this.activeWallId);
    if (wall) {
      wall.finish = finish;
      wall.blendMode = finish === "gloss" ? "overlay" : "multiply";
      wall.opacity = finish === "matte" ? 0.8 : 0.7;
    }
  }

  public calculateEstimator(): {
    netArea: number;
    gallonsNeeded: number;
    totalCost: number;
  } {
    const { width, height, length, doors, windows } = this.roomDimensions;
    const grossArea = 2 * (width + length) * height;
    const deductions = doors * 21 + windows * 15;
    const netArea = Math.max(0, grossArea - deductions);
    const gallonsNeeded = Math.ceil((netArea / 350) * 10) / 10;
    const totalCost = Math.ceil(gallonsNeeded * this.paintPricePerGallon);

    return { netArea, gallonsNeeded, totalCost };
  }

  public saveProject(title: string): SavedProject {
    const project: SavedProject = {
      id: Date.now(),
      title: title || "My Painted Room",
      date: new Date().toLocaleDateString(),
      imageSrc: this.imageSrc,
      walls: [...this.walls],
    };
    this.savedProjects.push(project);
    return project;
  }

  public loadProject(id: number): boolean {
    const proj = this.savedProjects.find((p) => p.id === id);
    if (proj) {
      this.imageSrc = proj.imageSrc;
      this.walls = [...proj.walls];
      this.activeWallId = null;
      return true;
    }
    return false;
  }
}
