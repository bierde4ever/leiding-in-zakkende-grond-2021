import { PoPsolution } from "./popsolution"

class PipeOnPole {
  public static xtotmax: number = 100
  g: number = 9.81 // gravity [m/s2]

  public d: number = 0.1 // outer diameter m
  public w: number = 0.01 // wall thicknes m
  public l: number = 6.0 // pipe segment length [m]
  public j: number = 3.1 // joint position [m]
  public p: number = 5 * (Math.PI / 180) // joint play [rad]
  public E: number = 100.0e9 // elasticity modulus [Pa]
  public T: number = 150e6 // tensile strength [Pa]
  public c: number = 0.8 // soil cover [m]
  public r: number = 1800.0 // soil density [kg/m3]
  public h: number = 0.2 // pole height [m]
  public rg: number = 8000.0 // material density [kg/m3]
  public get Iyy() {
    return (Math.PI / 64) * (Math.pow(this.d, 4) - Math.pow(this.d - 2 * this.w, 4))
  }
  public Solution: PoPsolution = new PoPsolution()

  /// <summary>
  /// maximum spanning in buiswand [Pa].
  /// </summary>
  /// <param name="sol"></param>
  /// <returns></returns>
  public maxstress(sol: PoPsolution): number {
    return ((sol.m(0) / this.Iyy) * this.d) / 2
  }

  /// <summary>
  /// initialiseer parameters voor solver.
  /// </summary>
  /// <param name="sol"></param>
  /// <returns></returns>
  public init(sol: PoPsolution): boolean {
    this.j -= this.l * Math.floor(this.j / this.l)
    sol.dict2.clear()
    let arr: number[] = []
    for (let i = 0; this.j - i * this.l > -PipeOnPole.xtotmax / 2; i++)
      arr.push(Math.round((this.j - i * this.l) * 1000000 + Number.EPSILON) / 1000000)
    //sol.dict2.set(Math.round((this.j - i * this.l) * 1000000 + Number.EPSILON) / 1000000, 0)
    for (let i = 1; this.j + i * this.l < PipeOnPole.xtotmax / 2; i++)
      arr.push(Math.round((this.j + i * this.l) * 1000000 + Number.EPSILON) / 1000000)
    //sol.dict2.set(Math.round((this.j + i * this.l) * 1000000 + Number.EPSILON) / 1000000, 0)
    arr.sort((e1, e2) => {
      return this.compareObjects(e1, e2)
    })
    for (let i = 0; i < arr.length; i++) {
      sol.dict2.set(arr[i], 0)
    }

    //sol.dict2.forEach((value, key) => console.log(`[${key}] = ${value}`))
    sol.ei = this.E * this.Iyy // kromtestraal (inverse 2de afgeleide) : lokaal moment [1/m2]
    sol.gg = (this.d * this.c * this.r + Math.PI * this.w * (this.d - 2 * this.w) * this.rg) * this.g
    return this.d - 2 * this.w > 0
  }

  private compareObjects(a: number, b: number) {
    if (a === b) return 0
    return a < b ? -1 : 1
  }

  public init_default(): boolean {
    return this.init(this.Solution)
  }

  public useTestValues() {
    this.d = 0.118
    this.w = 0.009 // wall thicknes m
    this.l = 6.0 // pipe segment length [m]
    this.j = 1 // joint position [m]
    this.p = 2.9 * (Math.PI / 180) // joint play [rad]
    this.E = 75.0e9 // elasticity modulus [Pa]
    this.T = 150e6 // tensile strength [Pa]
    this.c = 0.225 // soil cover [m]
    this.r = 1522.0 // soil density [kg/m3]
    this.h = 0.03 // pole height [m]
  }

  public Calculate(): boolean {
    if (!this.init_default()) return false
    let r: boolean = this.Solution.CalcXoXeX1X2(this.h, this.p)
    if (!r) r = this.Solution.Corrigeer()
    this.Solution.cleanjoints()
    return r
  }
}

export { PipeOnPole }
