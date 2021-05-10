export class PoPsolution {
  public dict2: Map<number, number> = new Map<number, number>()

  public epsX: number = 1e-10 // nauwkeurigheid intervalhalvering
  public epsY: number = 1e-10 // nauwkeurigheid rvw y(0)=h
  public gg: number = 0
  public ei: number = 0
  public xo: number = -4 // uitvoer parameter: positie van linker uiteinde van overspanning
  public xe: number = 4 // uitvoer parameter: positie van rechter uiteinde van overspanning
  public x1: number = -1 // position of zero moment (left side)
  public x2: number = 1 // position of zero moment (right side) Nb: xe*x2 = xo*x1

  public get fo(): number {
    // uitvoer parameter: kracht op linker uiteinde
    return ((this.xo - this.x1) * this.gg) / 2
  }
  public get fe(): number {
    // uitvoer parameter: kracht op rechter uiteinde
    return ((-this.gg / 2) * (this.xe * this.xe - this.xo * this.xo) - this.fo * this.xo) / this.xe
  }
  public get fp(): number {
    // uitvoer parameter: kracht op paal
    return -this.fo - this.fe - this.gg * (this.xe - this.xo)
  }
  public get xocalc(): number {
    return (this.xe * this.x2) / this.x1
  }
  public get x1calc(): number {
    return (this.xe * this.x2) / this.xo
  }
  public get x2calc(): number {
    return (this.xo * this.x1) / this.xe
  }
  public get xecalc(): number {
    return (this.xo * this.x1) / this.x2
  }
  public get y0p(): number {
    return this.y(this.epsX)
  }
  public get y0m(): number {
    return this.y(-this.epsX)
  }
  public get dy0p(): number {
    return this.dy(this.epsX)
  }
  public get dy0m(): number {
    return this.dy(-this.epsX)
  }

  /// <summary>
  /// Hoekverdraaiing in de leiding van -oo tot en met x met rvw dy(-oo)=0 of dy(+oo)=0.
  /// De hoekverdraaiing op de positie van een verbinding is onbepaald.
  /// voor scharnierposities wordt de verdraaiing aan buitenzijde gegeven
  /// </summary>
  /// <param name="x">x-positie</param>
  /// <returns></returns>
  public dy(x: number): number {
    if (x <= this.xo || x >= this.xe) return 0
    let dY: number
    if (x < 0) {
      let xx = x - this.xo
      dY = (-this.gg / this.ei / 6) * xx * xx * (2 * xx + 3 * (this.xo - this.x1))
      dY -= this.calculateSumIfLesser(x)
    } else {
      let xx = this.xe - x
      dY = (this.gg / this.ei / 6) * xx * xx * (2 * xx - 3 * (this.xe - this.x2))
      dY += this.calculateSumIfGreater(x)
    }
    return dY
  }
  /// <summary>
  /// Verplaatsing op positie x, bij randvoorwaarden dy(-oo)=0 en y(-oo) = 0, resp. dy(+oo)=0 en y(+oo) = 0
  /// </summary>
  /// <param name="x"></param>
  /// <returns></returns>
  public y(x: number): number {
    if (x <= this.xo || x >= this.xe) return 0
    let Y: number
    if (x < 0) {
      let xx = x - this.xo
      Y = (-this.gg / this.ei / 12) * xx * xx * xx * (xx + 2 * (this.xo - this.x1))
      let sum = this.calculateSumDistanceIfLesser(x)
      Y -= sum
    } else {
      let xx = this.xe - x
      Y = (-this.gg / this.ei / 12) * xx * xx * xx * (xx - 2 * (this.xe - this.x2))
      let sum = this.calculateSumDistanceIfGreater(x)
      Y += sum
    }
    return Y
  }

  private calculateSumDistanceIfGreater(x: number) {
    let sum = 0
    for (const [key, value] of this.dict2) {
      if (key > x) {
        sum += value * (x - key)
      }
    }
    return sum
  }
  private calculateSumIfGreater(x: number) {
    let sum = 0
    for (const [key, value] of this.dict2) {
      if (key > x) {
        sum += value
      }
    }
    return sum
  }
  private calculateSumDistanceIfLesser(x: number) {
    let sum = 0
    for (const [key, value] of this.dict2) {
      if (key < x) {
        sum += value * (x - key)
      }
    }
    return sum
  }
  private calculateSumIfLesser(x: number) {
    let sum = 0
    for (const [key, value] of this.dict2) {
      if (key < x) {
        sum += value
      }
    }
    return sum
  }
  /// <summary>
  /// Bereken de hoekverdraaiing in de verbindingen, bij gegeven momentverdeling.
  /// Verbindingen op posities x waar m(x)=0 krijgen hoekverdraaiing 0.
  /// </summary>
  public setjoints(p: number, h: number): void {
    const eps: number = 1e-10
    for (const item of this.dict2.keys()) {
      if (item > this.xo && item < this.xe && item > this.x1 && item < this.x2) this.dict2.set(item, p)
      else if (item == this.x1 || item == this.x2) this.dict2.set(item, 0)
      else if (item > this.xo && item < this.xe) this.dict2.set(item, -p)
      else this.dict2.set(item, 0)
    }
    if (this.dict2.has(0.0)) this.dict2.set(0.0, this.dy(eps) - this.dy(-eps))
    if (this.dict2.has(0.0)) console.log("key 0 in setjoints")
  }

  /// <summary>
  /// Verwijder alle verbindingen links van xo of rechts van xe uit de lijst.
  /// </summary>
  public cleanjoints(): void {
    let keys = this.dict2.keys()
    for (const item of keys) {
      if (item < this.xo - 5 * this.epsX || item > this.xe + 5 * this.epsX) {
        this.dict2.delete(item)
      }
    }
  }

  /// <summary>
  /// bereken verdeling van moment over de lengte van de leiding (neem aan xo*x1 = x2*xe!)
  /// </summary>
  /// <param name="x">x-positie</param>
  /// <returns>moment op positie x</returns>
  public m(x: number): number {
    if (x <= this.xo || x >= this.xe) return 0
    if (x < 0) return this.gg * (x - this.xo) * (x - this.x1)
    else return this.gg * (x - this.xe) * (x - this.x2)
  }
  //enkele procedures voor verdere informatie over de oplossing:
  public m_array(xx: number[]): number[] {
    let mm: number[] = []
    for (let i = 0; i < xx.length; i++) mm[i] = this.m(xx[i])
    return mm
  }
  public get maxy(): number {
    let xA = this.xo
    let xB = this.xe
    while (xB - xA > 1e-4) {
      let x = (xA + xB) / 2
      if (this.dy(x) > 0) xA = x
      else xB = x
    }
    return this.y((xB + xA) / 2)
  }

  /// <summary>
  /// bepaal Xo en Xe z.d.d. Y(0)=h. Hou Xo*X1 en Xe*X2 constant.
  /// </summary>
  /// <param name="h"></param>
  /// <param name="p"></param>
  /// <returns></returns>
  public CalcXoXe(h: number, p: number): boolean {
    let XX: number = this.xe * this.x2
    let xmax: number = Math.pow(((this.ei * h) / this.gg) * 72, 0.25)
    let xmin: number = xmax * 0.1
    let ke: number
    let k2: number
    let k1: number
    let ko: number
    let pke: number = 0
    let pk2: number = 0
    while (xmax - xmin > this.epsX) {
      this.xe = (xmax + xmin) / 2
      this.x2 = XX / this.xe
      this.setjoints(p, h)
      if (this.y0p > h) xmax = this.xe
      else xmin = this.xe
    }
    if (Math.abs(this.y0p - h) > this.epsY) {
      //indien geen convergentie dan moet er waarschijnlijk één verbinding niet helemaal uitgebogen zijn
      k2 = this.getPosition(this.x2, this.epsX)
      ke = this.getPosition(this.xe, this.epsX)
      if (ke != 0 && k2 != 0) {
        //indien beide vrij, dan hoekverdraaiing op xe minimaliseren (zo dicht mogelijk bij 0)
        this.x2 = k2
        this.xe = XX / this.x2
        this.dict2.set(ke, 0)

        this.incrementMapValue(k2, (this.y0p - h) / k2)
        if (this.dict2.has(k2) && this.dict2.get(k2)! < -p) {
          this.dict2.set(k2, -p)
          this.incrementMapValue(ke, (this.y0p - h) / ke)
        }
        if (this.dict2.has(k2)) pk2 = this.dict2.get(k2)! //bewaar even, want setjoints wordt verderop nog aangeroepen
        if (this.dict2.has(ke)) pke = this.dict2.get(ke)!
      } else if (k2 != 0) {
        this.x2 = k2
        this.xe = XX / this.x2
        this.incrementMapValue(k2, (this.y0p - h) / k2)
        pk2 = this.dict2.get(k2)!
      } else if (ke != 0) {
        this.xe = ke
        this.x2 = XX / this.xe
        this.incrementMapValue(ke, (this.y0p - h) / ke)
        pke = this.dict2.get(ke)!
      } // (ke == 0 && k2 == 0)
      else return false //Geen te corrigeren verbinding gevonden voor x>0.
    } else {
      ke = 0
      k2 = 0
    }
    if (this.dict2.has(0.0)) console.log("key 0 in calcxoxe (1)")

    xmax = Math.pow(((this.ei * h) / this.gg) * 72, 0.25)
    xmin = xmax * 0.1
    XX = this.xo * this.x1
    while (xmax - xmin > this.epsX) {
      this.xo = -(xmax + xmin) / 2
      this.x1 = XX / this.xo
      this.setjoints(p, h)
      if (this.y0m > h) xmax = -this.xo
      else xmin = -this.xo
    }

    if (Math.abs(this.y0m - h) > this.epsY) {
      //indien geen convergentie dan moet er waarschijnlijk één verbinding niet helemaal uitgebogen zijn
      ko = this.getPosition(this.xo, this.epsX)
      k1 = this.getPosition(this.x1, this.epsX)
      if (k1 != 0 && ko != 0) {
        this.x1 = k1
        this.xo = XX / this.x1
        this.dict2.set(ko, 0)
        this.decrementMapValue(k1, (this.y0m - h) / k1)
        if (this.dict2.has(k1) && this.dict2.get(k1)! < -p) {
          this.dict2.set(k1, -p)
          this.decrementMapValue(ko, (this.y0m - h) / ko)
        }
      } else if (k1 != 0) {
        this.x1 = k1
        this.xo = XX / this.x1
        this.decrementMapValue(k1, (this.y0m - h) / k1)
      } else if (ko != 0) {
        this.xo = ko
        this.x1 = XX / this.xo
        this.decrementMapValue(ko, (this.y0m - h) / ko)
      } else return false //Geen te corrigeren verbinding gevonden voor x<0.
    }
    if (ke != 0) this.dict2.set(ke, pke)
    if (k2 != 0) this.dict2.set(k2, pk2)
    if (this.dict2.has(0.0)) console.log("key 0 in calcxoxe (2)")
    return true
  }

  private incrementMapValue(key: number, value: number): void {
    let tmp = this.dict2.get(key)
    if (tmp != undefined) {
      this.dict2.set(key, tmp + value)
    } else {
      this.dict2.set(key, value)
    }
    if (this.dict2.has(0.0)) console.log("key 0 in incrementMapValue")
  }
  private decrementMapValue(key: number, value: number): void {
    let tmp = this.dict2.get(key)
    if (tmp != undefined) {
      this.dict2.set(key, tmp - value)
    } else {
      this.dict2.set(key, -value)
    }
    if (this.dict2.has(0.0)) console.log("key 0 in decrementMapValue")
  }

  /// <summary>
  /// bepaal xo,x1,x2,xe zdd aan voorwaarden op x=0 is voldaan.
  /// </summary>
  /// <param name="h"></param>
  /// <param name="p"></param>
  /// <returns></returns>
  public CalcXoXeX1X2(h: number, p: number): boolean {
    let XXmax: number = Math.pow(((this.ei * h) / this.gg) * 72, 0.5) / 3 //dit is de oplossing als p=0
    let XXmin: number = 0
    let XX: number = 0
    let pp: number
    while (XXmax - XXmin > this.epsX) {
      XX = (XXmax + XXmin) / 2
      this.xe = Math.pow(((this.ei * h) / this.gg) * 72, 0.25)
      this.x2 = XX / this.xe
      this.x1 = -this.x2
      this.xo = -this.xe
      //      console.log(this.xo)
      if (!this.CalcXoXe(h, p)) return false
      if (this.dict2.has(0.0)) {
        if (this.dy0m - this.dy0p > p) XXmin = XX
        else XXmax = XX
      } else {
        if (this.dy0m - this.dy0p > 0) XXmin = XX
        else XXmax = XX
      }
    }
    return this.dict2.has(0.0) || Math.abs(this.dy0m - this.dy0p) < this.epsX
  }

  /// <summary>
  /// Probeer oplossing te corrigeren als dy0m != dy0p.
  /// Dit kan alleen als er links of rechts twee vrije verbindingen zijn.
  /// </summary>
  /// <param name="h"></param>
  /// <param name="p"></param>
  /// <returns></returns>
  public Corrigeer(): boolean {
    if (this.dict2.has(0.0) === false) return false //indien verbinding op paaltje ligt is correctie zinloos.

    let ke = this.getPosition(this.xe, 15 * this.epsX)
    let k2 = this.getPosition(this.x2, 2 * this.epsX)
    let k1 = this.getPosition(this.x1, 2 * this.epsX)
    let ko = this.getPosition(this.xo, 15 * this.epsX)
    let pp = this.dy0p - this.dy0m
    if (ke != 0 && k2 != 0) {
      this.decrementMapValue(k2, (pp * this.xe) / (this.xe - this.x2))
      this.incrementMapValue(ke, (pp * this.x2) / (this.xe - this.x2))
      return true
    } else if (ko != 0 && k1 != 0) {
      this.decrementMapValue(k1, (pp * this.xo) / (this.xo - this.x1))
      this.incrementMapValue(ko, (pp * this.x1) / (this.xo - this.x1))
      return true
    }
    return false
  }

  private getPosition(position: number, interval: number): number {
    for (const item of this.dict2.keys()) {
      if (Math.abs(item - position) < interval) {
        return item
      }
    }
    return 0
    // let ke = this.Keys.FirstOrDefault(d => Math.abs(d - this.xe) < 15*this.epsX);
    // let k2 = this.Keys.FirstOrDefault(d => Math.abs(d - this.x2) < 2*this.epsX);
    // let k1 = this.Keys.FirstOrDefault(d => Math.abs(d - this.x1) < 2*this.epsX);
    // let ko = this.Keys.FirstOrDefault(d => Math.abs(d - this.xo) < 15*this.epsX);
  }
}
