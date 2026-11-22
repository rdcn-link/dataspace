import subprocess,tarfile
from pathlib import Path

root=Path('/mnt/data/conet/data-robots')
root.mkdir(exist_ok=True)
with tarfile.open('/mnt/data/conet/data-robots-deploy.tar.gz') as archive:
    for member in archive.getmembers():
        target=(root/member.name).resolve()
        target.relative_to(root.resolve())
        assert not member.issym() and not member.islnk()
    archive.extractall(root)
unit='''[Unit]
Description=CONET data intelligence robot workbench
After=network-online.target
Wants=network-online.target
[Service]
Type=simple
User=anuser
Group=anuser
WorkingDirectory=/mnt/data/conet/data-robots
Environment=HOST=127.0.0.1
Environment=PORT=9590
Environment=ROBOT_STATE=/mnt/data/conet/data-robots/state
ExecStart=/mnt/data/conet/runtime/node/bin/node /mnt/data/conet/data-robots/server.mjs
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
UMask=0077
[Install]
WantedBy=multi-user.target
'''
(root/'data-robots.service').write_text(unit)
subprocess.run(['/mnt/data/conet/runtime/node/bin/node','--test','test.mjs'],cwd=root,check=True)
print('Source extracted and server-side tests passed. Unit prepared.')
