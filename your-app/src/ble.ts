export type Cue = "normal" | "chance" | "pinch";

export type BleConfig = {
  serviceUuid: string;
  characteristicUuid: string;
};

export type BleState = {
  connected: boolean;
  deviceName: string;
};

function cueToByte(cue: Cue): number {
  if (cue === "normal") return 0;
  if (cue === "chance") return 1;
  return 2;
}

export class BleClient {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  public state: BleState = { connected: false, deviceName: "" };
  private onStateChange: ((s: BleState) => void) | null = null;

  public setOnStateChange(fn: ((s: BleState) => void) | null) {
    this.onStateChange = fn;
  }

  private emit() {
    this.onStateChange?.(this.state);
  }

  public isSupported(): boolean {
    return typeof navigator !== "undefined" && !!navigator.bluetooth;
  }

  public async connect(cfg: BleConfig): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Web Bluetoothが利用できません（Chrome/Edge推奨）");
    }

    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [cfg.serviceUuid]
    });

    this.device = device;

    device.addEventListener("gattserverdisconnected", () => {
      this.cleanup();
    });

    if (!device.gatt) {
      throw new Error("GATTに接続できませんでした");
    }

    this.server = await device.gatt.connect();
    const service = await this.server.getPrimaryService(cfg.serviceUuid);
    this.characteristic = await service.getCharacteristic(cfg.characteristicUuid);

    const name = device.name ?? "BLE Device";
    this.state = { connected: true, deviceName: name };
    this.emit();
  }

  public async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.cleanup();
  }

  public async sendCue(cue: Cue): Promise<void> {
    if (!this.characteristic) throw new Error("未接続です");
    const v = cueToByte(cue);
    const buf = new Uint8Array([0x01, v]);
    await this.characteristic.writeValue(buf);
  }

  public async stop(): Promise<void> {
    if (!this.characteristic) throw new Error("未接続です");
    const buf = new Uint8Array([0xff]);
    await this.characteristic.writeValue(buf);
  }

  public async setIntensity(value01: number): Promise<void> {
    if (!this.characteristic) throw new Error("未接続です");
    const v = Math.max(0, Math.min(1, value01));
    const scaled = Math.round(v * 100);
    const buf = new Uint8Array([0x02, scaled]);
    await this.characteristic.writeValue(buf);
  }

  private cleanup(): void {
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.state = { connected: false, deviceName: "" };
    this.emit();
  }
}
