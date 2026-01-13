import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { BleClient, Cue, BleState } from "./ble";
import { PhoneFrame, Card, Row, Pill, Button, Toggle, TextInput, Slider, Segmented, Modal } from "./ui";

type Role = "operator" | "parent_setup" | "parent_home";

function useRole(): Role {
  const loc = useLocation();
  if (loc.pathname.startsWith("/operator")) return "operator";
  if (loc.pathname.startsWith("/parent/home")) return "parent_home";
  return "parent_setup";
}

function cueLabel(cue: Cue): string {
  if (cue === "chance") return "チャンス";
  if (cue === "pinch") return "ピンチ";
  return "通常";
}

function cueExplain(cue: Cue): string {
  if (cue === "chance") return "いまはチャンス。応援してみよう。トントン。";
  if (cue === "pinch") return "いまはピンチ。じっと見て次の動きを待とう。";
  return "いまはふつう。次の合図が来たら教えるね。";
}

export default function App() {
  const ble = useMemo(() => new BleClient(), []);
  const role = useRole();

  const [bleState, setBleState] = useState<BleState>({ connected: false, deviceName: "" });

  useEffect(() => {
    ble.setOnStateChange((s) => setBleState({ ...s }));
    return () => ble.setOnStateChange(null);
  }, [ble]);

  const connected = bleState.connected;
  const deviceName = bleState.deviceName;

  const [demo, setDemo] = useState<boolean>(true);
  const [cue, setCue] = useState<Cue>("normal");
  const [paused, setPaused] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [intensity, setIntensity] = useState<number>(60);

  const [serviceUuid, setServiceUuid] = useState<string>("0000ffe0-0000-1000-8000-00805f9b34fb");
  const [characteristicUuid, setCharacteristicUuid] = useState<string>("0000ffe1-0000-1000-8000-00805f9b34fb");

  const [error, setError] = useState<string>("");
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [lastCueAt, setLastCueAt] = useState<number>(Date.now());

  async function doConnect() {
    setError("");
    try {
      await ble.connect({ serviceUuid, characteristicUuid });
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  async function doDisconnect() {
    setError("");
    try {
      await ble.disconnect();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  async function pushCue(next: Cue) {
    setCue(next);
    setLastCueAt(Date.now());

    if (demo) return;
    if (paused) return;

    setError("");
    try {
      await ble.sendCue(next);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  async function pushStop() {
    setError("");
    if (demo) return;
    try {
      await ble.stop();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  async function pushIntensity(v: number) {
    setIntensity(v);
    if (demo) return;

    setError("");
    try {
      await ble.setIntensity(v / 100);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  return (
    <div className="shell">
      <nav className="nav">
        <div className="navInner">
          <Link className={`navLink ${role === "operator" ? "navLink_on" : ""}`} to="/operator">
            運用
          </Link>
          <Link className={`navLink ${role === "parent_setup" ? "navLink_on" : ""}`} to="/parent/setup">
            親 初回
          </Link>
          <Link className={`navLink ${role === "parent_home" ? "navLink_on" : ""}`} to="/parent/home">
            親 観戦中
          </Link>
        </div>
      </nav>

      <Routes>
        <Route
          path="/operator"
          element={
            <PhoneFrame title="運用UI">
              <Card>
                <Row className="row_between">
                  <div>
                    <div className="h2">接続</div>
                    <div className="sub">
                      {connected ? (
                        <span>
                          <Pill text="接続済" tone="ok" /> <span className="mono">{deviceName}</span>
                        </span>
                      ) : (
                        <span>
                          <Pill text="未接続" tone="warn" /> <span className="sub">デモでも操作可能</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="btnCol">
                    {connected ? (
                      <Button label="切断" onClick={doDisconnect} variant="ghost" />
                    ) : (
                      <Button label="接続" onClick={doConnect} variant="primary" />
                    )}
                  </div>
                </Row>

                <div className="sp8" />

                <Toggle
                  label={demo ? "デモ オン" : "デモ オフ"}
                  value={demo}
                  onChange={(v) => {
                    setDemo(v);
                    if (v) setError("");
                  }}
                />

                <div className="sp12" />

                <details className="details">
                  <summary>UUID設定</summary>
                  <div className="sp8" />
                  <TextInput label="Service UUID" value={serviceUuid} onChange={setServiceUuid} placeholder="例 0000ffe0..." />
                  <TextInput
                    label="Characteristic UUID"
                    value={characteristicUuid}
                    onChange={setCharacteristicUuid}
                    placeholder="例 0000ffe1..."
                  />
                  <div className="hint">実機送信するならUUIDをデバイス仕様に合わせてください</div>
                </details>

                {!ble.isSupported() && <div className="warnBox">この環境はWeb Bluetooth非対応です。Chrome/Edge推奨です。</div>}
                {error && <div className="warnBox">{error}</div>}
              </Card>

              <div className="sp12" />

              <Card>
                <div className="h2">試合状態</div>
                <div className="sub">送信中：{cueLabel(cue)}</div>
                <div className="sp12" />
                <div className="grid3">
                  <button className={`bigBtn ${cue === "chance" ? "bigBtn_on" : ""}`} onClick={() => pushCue("chance")} type="button">
                    チャンス
                  </button>
                  <button className={`bigBtn ${cue === "pinch" ? "bigBtn_on" : ""}`} onClick={() => pushCue("pinch")} type="button">
                    ピンチ
                  </button>
                  <button className={`bigBtn ${cue === "normal" ? "bigBtn_on" : ""}`} onClick={() => pushCue("normal")} type="button">
                    通常
                  </button>
                </div>

                <div className="sp12" />

                <Row className="row_between">
                  <Button label="緊急停止" onClick={pushStop} variant="ghost" />
                  <Pill text={demo ? "デモ中" : connected ? "実機送信" : "未接続"} tone={demo ? "muted" : connected ? "ok" : "warn"} />
                </Row>
              </Card>
            </PhoneFrame>
          }
        />

        <Route
          path="/parent/setup"
          element={
            <PhoneFrame title="親 初回セットアップ">
              <Card>
                <div className="h2">ペアリング</div>
                <div className="sub">親がスマホで接続します</div>
                <div className="sp12" />

                <Row className="row_between">
                  <div>
                    {connected ? (
                      <span>
                        <Pill text="接続済" tone="ok" /> <span className="mono">{deviceName}</span>
                      </span>
                    ) : (
                      <span>
                        <Pill text="未接続" tone="warn" /> <span className="sub">まず接続</span>
                      </span>
                    )}
                  </div>
                  <div className="btnCol">
                    {connected ? (
                      <Button label="切断" onClick={doDisconnect} variant="ghost" />
                    ) : (
                      <Button
                        label="接続"
                        onClick={() => {
                          setDemo(false);
                          doConnect();
                        }}
                        variant="primary"
                      />
                    )}
                  </div>
                </Row>

                <div className="sp12" />

                <Segmented
                  label="観戦モード"
                  value="parent_child"
                  options={[
                    { key: "parent_child", label: "親子" },
                    { key: "kids", label: "子ども" }
                  ]}
                  onChange={() => {}}
                />

                <div className="sp12" />

                <Slider label="強さ" value={intensity} onChange={pushIntensity} />

                <div className="sp12" />

                <details className="details">
                  <summary>UUID設定</summary>
                  <div className="sp8" />
                  <TextInput label="Service UUID" value={serviceUuid} onChange={setServiceUuid} />
                  <TextInput label="Characteristic UUID" value={characteristicUuid} onChange={setCharacteristicUuid} />
                  <div className="hint">デバイス仕様に合わせて設定してください</div>
                </details>

                {error && <div className="warnBox">{error}</div>}
              </Card>

              <div className="sp12" />

              <Card>
                <div className="h2">超短縮チュートリアル</div>
                <div className="sub">30秒で分かる</div>
                <div className="sp12" />
                <div className="list">
                  <div className="listItem">チャンスの振動：応援してみよう</div>
                  <div className="listItem">ピンチの振動：じっと見てみよう</div>
                  <div className="listItem">分からない時：観戦中ホームの「今なに？」</div>
                </div>
                <div className="sp12" />
                <Row className="row_between">
                  <Button label="緊急停止" onClick={pushStop} variant="ghost" />
                  <Link className="linkBtn" to="/parent/home">
                    観戦中へ
                  </Link>
                </Row>
              </Card>
            </PhoneFrame>
          }
        />

        <Route
          path="/parent/home"
          element={
            <PhoneFrame title="親 観戦中">
              <Card className="hero">
                <div className="heroTop">
                  <div>
                    <div className="h2">いまの合図</div>
                    <div className="sub">最終更新：{new Date(lastCueAt).toLocaleTimeString()}</div>
                  </div>
                  <Pill text={cueLabel(cue)} tone={cue === "normal" ? "muted" : "ok"} />
                </div>

                <div className="sp12" />

                <div className="cueBig">{cueLabel(cue)}</div>

                <div className="sp12" />

                <Row className="row_between">
                  <Button label="今なに？" onClick={() => setHelpOpen(true)} variant="primary" />
                  <Button label={paused ? "一時停止中" : "一時停止"} onClick={() => setPaused(!paused)} variant="ghost" />
                </Row>

                <div className="sp12" />

                <Row className="row_between">
                  <Button label={muted ? "静音中" : "静音"} onClick={() => setMuted(!muted)} variant="ghost" />
                  <Button label="緊急停止" onClick={pushStop} variant="ghost" />
                </Row>

                <div className="sp12" />

                <Slider label="強さ" value={intensity} onChange={pushIntensity} />
              </Card>

              <div className="sp12" />

              <Card>
                <div className="h2">接続状態</div>
                <div className="sp8" />
                <Row className="row_between">
                  <div>
                    {connected ? (
                      <span>
                        <Pill text="接続済" tone="ok" /> <span className="mono">{deviceName}</span>
                      </span>
                    ) : (
                      <span>
                        <Pill text="未接続" tone="warn" /> <span className="sub">デモで確認中</span>
                      </span>
                    )}
                  </div>
                  <div className="btnCol">
                    {connected ? (
                      <Button label="切断" onClick={doDisconnect} variant="ghost" />
                    ) : (
                      <Button label="接続" onClick={doConnect} variant="primary" />
                    )}
                  </div>
                </Row>
                {error && <div className="warnBox">{error}</div>}
              </Card>

              <Modal open={helpOpen} title="今なに？" onClose={() => setHelpOpen(false)} body={<div className="modalText">{cueExplain(cue)}</div>} />
            </PhoneFrame>
          }
        />

        <Route
          path="*"
          element={
            <PhoneFrame title="観戦UI">
              <Card>
                <div className="h2">開始</div>
                <div className="sp12" />
                <div className="grid1">
                  <Link className="linkBig" to="/operator">
                    運用UIへ
                  </Link>
                  <Link className="linkBig" to="/parent/setup">
                    親 初回へ
                  </Link>
                  <Link className="linkBig" to="/parent/home">
                    親 観戦中へ
                  </Link>
                </div>
              </Card>
            </PhoneFrame>
          }
        />
      </Routes>
    </div>
  );
}
