import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="text-xl">🦞</span> Ship Dangerously
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              The community for AI wins and sins. Vote, share, and wear the
              best.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/feed" className="hover:text-foreground">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-foreground">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/generate" className="hover:text-foreground">
                  AI Studio
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">Community</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/submit" className="hover:text-foreground">
                  Submit a Post
                </Link>
              </li>
              <li>
                <Link href="/feed?filter=trending" className="hover:text-foreground">
                  Trending
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">Domains</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>shipdangerously.com</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Ship Dangerously. All rights
          reserved. 🦞
        </div>
      </div>
    </footer>
  );
}
