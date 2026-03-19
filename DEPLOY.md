# Deploy Slay Station – All Changes

**Repository:** [github.com/preston-254/Slaystation.ke](https://github.com/preston-254/Slaystation.ke)  
**Live site:** [slaystation-ke.vercel.app](https://slaystation-ke.vercel.app)

Your site files are in this folder (`deploy`). Use one of the methods below.

---

## Deploy the `images` folder (GitHub + Vercel)

For the **images** folder to be live on the site, it must be in the repo and pushed:

1. **Ensure `images` is not ignored**  
   `.gitignore` should not contain `images/` (only `.firebase/` is ignored).

2. **Add and push the images folder** (from your project root, e.g. where `deploy` lives):
   ```powershell
   git add deploy/images/
   git status
   git commit -m "Deploy images folder"
   git push origin main
   ```
   If your repo root **is** the deploy folder (e.g. you clone Slaystation.ke and see `index.html` and `images/` side by side), run instead:
   ```powershell
   git add images/
   git commit -m "Deploy images folder"
   git push origin main
   ```

3. **Vercel** deploys the whole repo (or the Root Directory you set). The `images/` folder at repo root (or inside your Root Directory) will be served at `https://slaystation-ke.vercel.app/images/...`.

---

### Quick deploy (push to **preston-254/Slaystation.ke**)

Open PowerShell or Git Bash in your project folder and run:

```powershell
cd "C:\Users\USER\Documents\slaystation bags\slaystation"
# If you see "rebase in progress", finish or abort it first:
#   git rebase --abort
git add deploy/
git add deploy/images/
git status
git commit -m "Deploy: include images folder"
# If push is rejected ("remote contains work you do not have"), pull first then push:
git pull origin main --rebase
git push origin main
```

If your branch is `master` instead of `main`, use `git push origin master`.  
If push asks for login, use your GitHub username (**preston-254**) and a [Personal Access Token](https://github.com/settings/tokens) as the password.

---

### Branch diverged from GitHub (local ahead, push never finished)

If `git status` says **"Your branch and 'origin/main' have diverged"** (e.g. 55 and 8 commits), GitHub never got your latest pushes. Use one of these:

**Option A – Overwrite remote with your local (fastest; use if the 8 commits on GitHub don’t matter):**

```powershell
cd "C:\Users\USER\Documents\slaystation bags\slaystation"
git push origin main --force
```

After this, check **github.com/preston-254/Slaystation.ke** — your latest code (including `images/`) should be there and Vercel will auto-deploy.

**Option B – Keep remote commits and replay yours on top (no force):**

```powershell
cd "C:\Users\USER\Documents\slaystation bags\slaystation"
git config http.postBuffer 524288000
git pull origin main --rebase
git push origin main
```

If you get **RPC failed / Recv failure**, run the same commands again on a stable connection; the larger buffer helps with big pushes.

---

## Option 1: Vercel (recommended)

If the project is already connected to Vercel:

1. **Push to Git** (triggers automatic deploy):
   ```bash
   cd "C:\Users\USER\Documents\slaystation bags\slaystation"
   git add deploy/
   git add -u
   git commit -m "Deploy: cart, checkout, menu, East African cities, search"
   git push
   ```
   Remote: `https://github.com/preston-254/Slaystation.ke.git`.  
   In Vercel: **Project → Settings → Git**: connect **preston-254/Slaystation.ke**. Set **Root Directory** to `deploy` if your repo has a parent folder, or leave blank if the repo root is this deploy folder (index.html and images/ at root).

2. **Or deploy with CLI** (after logging in once):
   ```bash
   cd "C:\Users\USER\Documents\slaystation bags\slaystation\deploy"
   vercel login
   vercel --prod
   ```

---

## Option 2: GitHub Pages

1. Push your code to GitHub (see Option 1 Step 1; remote: `https://github.com/preston-254/slay.git`).
2. In the repo: **Settings → Pages**.
3. **Source**: Deploy from branch `main` (or `master`), folder **/ (root)** or **/deploy** (depending on where `index.html` lives in the repo).
4. Save. The site will be at **`https://preston-254.github.io/slay/`**.

---

## Option 3: Netlify

1. Drag and drop the `deploy` folder onto [app.netlify.com](https://app.netlify.com) (Drop folder), or connect the Git repo and set **Publish directory** to `deploy` (or the path that contains `index.html`).
2. Deploy. Later updates: push to Git and Netlify will redeploy.

---

## Option 4: Firebase Hosting

Your `firebase.json` currently points to a `Public` folder. To host this site:

1. Copy the contents of `slaystation/deploy` into the folder that Firebase uses as `public` (e.g. `Public` in the same directory as `firebase.json`), **or**
2. Change `firebase.json`: set `"public": "slaystation/deploy"` (path relative to where `firebase.json` lives).
3. Then run:
   ```bash
   cd "C:\Users\USER\Documents\slaystation bags"
   firebase deploy
   ```

---

## Summary of changes to deploy

- Cart page: “You would also love” section, remove-from-cart button, layout and styles.
- Checkout: Fashionphile-style payment (card + M-Pesa), Country + County/City (East African cities), map for Nairobi, delivery fee from shop location.
- Header search bar (when implemented): opens on search icon click.
- **Sale removed from main menu** on all pages (index, about, accessories, lip-care, wallets, order-history, signup, login).
- East African cities / delivery and map in checkout (index order form).

Once you push to Git (Vercel/Netlify) or run the deploy command (Vercel CLI / Firebase), all these updates will go live.

---

## Files unified (no more old/new mix)

If you saw old and new content mixed: the **Flash Sale** link was removed from the **main navigation** on every page so the menu matches the intended design. The Flash Sale **banner** on the homepage is unchanged (users can still close it). All deploy HTML files now use the same nav (no Sale in the menu).
