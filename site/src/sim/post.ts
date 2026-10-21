import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import type { Quality } from './store'

/*
  Son işleme: sahne HDR (yarım kayan nokta) hedefe çizilir, parlama (bloom) ve seçim konturu eklenir,
  ton eşleme ve sRGB dönüşümü en sonda OutputPass ile yapılır.
  Kenar yumuşatma: sahnenin çizildiği hedef çoklu örneklemelidir (MSAA). Bütün geçişler bu hedefi okuyup ona
  yazdığı için ikinci hedef örneklemesiz tutulur (bellek tasarrufu).
  Düşük kalitede son işleme kapalıdır; motor doğrudan ekrana çizer.
*/
export class PostFx {
  composer: EffectComposer
  private bloom: UnrealBloomPass
  private outline: OutlinePass
  private night = -1

  constructor(
    private renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    quality: Exclude<Quality, 'low'>,
  ) {
    const w = window.innerWidth
    const h = window.innerHeight
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType })
    this.composer = new EffectComposer(renderer, rt)
    this.composer.renderTarget2.samples = quality === 'high' ? 4 : 2
    this.composer.setPixelRatio(PostFx.pixelRatio(quality))
    this.composer.setSize(w, h)

    this.composer.addPass(new RenderPass(scene, camera))

    this.outline = new OutlinePass(new THREE.Vector2(w, h), scene, camera)
    this.outline.edgeStrength = 4
    this.outline.edgeGlow = 0.6
    this.outline.edgeThickness = 1.6
    // logaritmik derinlik tamponunda gizli/görünür ayrımı güvenilir değil: iki renk aynı
    this.outline.visibleEdgeColor.set('#f6b93b')
    this.outline.hiddenEdgeColor.set('#f6b93b')
    this.outline.enabled = false
    this.composer.addPass(this.outline)

    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.18, 0.4, 6)
    this.composer.addPass(this.bloom)

    this.composer.addPass(new OutputPass())
  }

  static pixelRatio(q: Exclude<Quality, 'low'>) {
    const dpr = window.devicePixelRatio || 1
    return q === 'high' ? Math.min(dpr, 1.5) : Math.min(dpr, 1)
  }

  setSize(w: number, h: number) {
    this.composer.setSize(w, h)
  }

  /** Konturlanan nesneler (üzerine gelinen ve seçilen) */
  setOutlined(objs: THREE.Object3D[]) {
    this.outline.selectedObjects = objs
    this.outline.enabled = objs.length > 0
  }

  /** Gece ışıklar parlar; gündüz yalnızca çok parlak yerler (güneş yansıması) */
  setNight(n: number) {
    const q = Math.round(n * 20) / 20
    if (q === this.night) return
    this.night = q
    this.bloom.strength = THREE.MathUtils.lerp(0.18, 0.75, q)
    // gündüz yalnızca ışık kaynakları parlasın; güneş alan beyaz çatı ve duvar parlamasın
    this.bloom.threshold = THREE.MathUtils.lerp(6, 0.55, q)
    this.bloom.radius = THREE.MathUtils.lerp(0.4, 0.6, q)
  }

  render(dt: number) {
    this.composer.render(dt)
  }

  dispose() {
    this.composer.renderTarget1.dispose()
    this.composer.renderTarget2.dispose()
    this.composer.passes.forEach((p) => p.dispose())
    this.renderer.setRenderTarget(null)
  }
}
