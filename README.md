# udon-highlighter

Udon Syntax Highlighter Bounty

### Preliminaries

I put all my Urbit stuff in `~/URBIT`.

```
    cd ~/URBIT/
    git clone https://github.com/jfranklin9000/udon-highlighter.git
```

### Build Urbit

```
    cd ~/URBIT/urbit-master
    git pull
```
```
remote: Enumerating objects: 654, done.
remote: Counting objects: 100% (654/654), done.
remote: Compressing objects: 100% (67/67), done.
remote: Total 933 (delta 596), reused 640 (delta 586), pack-reused 279
Receiving objects: 100% (933/933), 1.94 MiB | 710.00 KiB/s, done.
Resolving deltas: 100% (700/700), completed with 159 local objects.
From https://github.com/urbit/urbit
   ab562348e..ab1f70ef4  master                      -> origin/master
   ae01030e5..626f7c9a7  alef-testnet                -> origin/alef-testnet
   b2e9afed2..753c9ef17  bs/uterm                    -> origin/bs/uterm
 * [new branch]          fix-zero-sized-capped-queue -> origin/fix-zero-sized-capped-queue
   03da8b40f..c253ed2a8  philip/kale                 -> origin/philip/kale
   a7c6f0ce1..aa0276cef  safe-prototype              -> origin/safe-prototype
 * [new branch]          stage-solid-redux           -> origin/stage-solid-redux
First, rewinding head to replay your work on top of it...
Applying: make udon inline code match block code and enable inline code gaps in Publish app
Applying: modify udon parser to preserve gaps in inline code blocks
```
```
    git log
```
```
commit 3c6bbae25f7d5991c0ed93c05cfd278fcc530a84 (HEAD -> master)
Author: John Franklin <jfranklin9000@gmail.com>
Date:   Mon Aug 5 03:51:35 2019 -0500

    modify udon parser to preserve gaps in inline code blocks

commit 7bda2fb6f4b535d112fa9eef833e6304e9ccd508
Author: John Franklin <jfranklin9000@gmail.com>
Date:   Mon Aug 5 02:30:06 2019 -0500

    make udon inline code match block code and enable inline code gaps in Publish app

commit ab1f70ef49112e9ee42dc13f4dab55d6d2cb5c27 (origin/master, origin/HEAD)
Merge: cb778c79f 68d9acae5
Author: Elliot Glaysher <elliot@tlon.io>
Date:   Tue Aug 6 16:10:49 2019 -0700

    Merge pull request #1433 from urbit/fix-zero-sized-capped-queue

    Fix capped queues to not crash when the size is set to 0.
```
```
    make install
    ls -l `which urbit` | cut -d '>' -f 2 | cut -c 2-1000
```
```
/nix/store/pqwxf5bsjk1sij9lxsq5kp80bv1w05qy-urbit/bin/urbit
```
```
    urbit -R
```
```
urbit 0.8.1
gmp: 6.1.2
sigsegv: 2.12
openssl: OpenSSL 1.0.2p  14 Aug 2018
curses: ncurses 6.1.20181027
libuv: 1.9.1
libh2o: 0.13.5
lmdb: 0.9.22
curl: 7.62.0
argon2: 0x13
```

### Make a fake `zod`

```
    cd ~/URBIT/udon-highlighter
    urbit -A pkg/arvo -F zod
```

We want commits `7bda2fb6f4b535d112fa9eef833e6304e9ccd508` and
`3c6bbae25f7d5991c0ed93c05cfd278fcc530a84` hence the `-A pkg/arvo`. 

```
    |mount /=home=
```

Append the following to `home/app/publish/css/index.css` _(optional)_:

```
code {
  padding: 8px;
  background-color: #f9f9f9;
  white-space: pre-wrap;
}
```

From the shell:

```
    # populate static-site from snips
    make
    # link static-site into home desk
    mkdir -p zod/home/web
    ln -s `pwd`/static-site zod/home/web/static-site
```

From the dojo:

```
    |commit %home
    |static
```

From the shell:

```
    ln -s zod/.urb/put/web/static-site rendered
    ls rendered/
```

## QUESTIONS

- Should we fail gracefully?

- The udon docs say a header are haxes followed
  by a single space followed by the actual text.
  Do we want to enforce a single space?
  The parser doesn't now; I guess the "actual text"
  can start with spaces.

- lineIsEmpty(line) => empty or _whitespace only_
  What about udon parser?
