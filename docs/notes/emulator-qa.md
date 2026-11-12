# Android emulator and responsive QA — 2026-11-09

## Result

Tested the installed LDPlayer 9.1.63.0 Android emulator using its Chrome browser, plus desktop browser responsive viewports. All activity used synthetic accounts and a fresh disposable QA database. No actual payment was made and the cafe database was not changed.

### Android emulator

- Opened the customer table URL for PC-02 and logged in with the synthetic customer phone only, without a password.
- Verified idle-table balance (120 standard minutes), no running gaming session, dashboard scrolling and menu navigation.
- Added a 25,000 VND food item, opened the cart, reviewed cash payment and submitted the order.
- Verified the resulting order history: cash order #2 at 25,000 VND pending processing; QR order #1 from the responsive-browser test shown separately as waiting for staff confirmation.
- Native testing used the emulator's existing landscape/tablet display configuration. It does not establish Android phone portrait, iPhone Safari or software-keyboard compatibility.

The emulator's special host address timed out. A temporary Vite server bound to the host's private Wi-Fi address, forwarding API traffic to the isolated loopback QA backend, resolved connectivity. Emulator paste/Enter input was unreliable; direct keys and visible browser navigation were used. No firewall/security settings were changed. The temporary proxies, backend, test browser tab and emulator were stopped, and the disposable database was removed.

### Responsive browser checks

Dashboard and menu were checked at 320x568, 375x667, 390x844, 412x915 and 844x390. Document widths stayed within the viewport in every case. These are layout checks, not emulation of Safari's engine or device touch hardware.

A QR checkout at 390px showed the amount, code and transfer controls. At 320x568 the confirmation control was below the initial fold but reachable by scrolling; activation transitioned the order to waiting for confirmation and displayed success. Order history and logout also worked.

## Change made

Customer dashboard action buttons now have a minimum height of 48px. Below 360px, actions stack vertically to give labels more room. The 320px layout measured 281px-wide, 48px-high actions after the change.

Frontend TypeScript/production build passed after the change; the existing large-chunk warning remains. No backend code changed in this stage, so the previous 147-test backend result was not rerun.

Local screenshot evidence (ignored artifacts): `target/qa-android-emulator.png` and `target/qa-emulated-phone.png`.

## Remaining checks

Physical iPhone Safari, QR camera scanning, the software keyboard, device background/resume, offline recovery, reduced motion and actual bank reconciliation still require device/staging acceptance. Android emulator success is additional evidence, not a replacement for these checks.
