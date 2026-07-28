// Every icon from the lucide-animated registry imports `cn` from here.
// It's normally shadcn's class merger (clsx + tailwind-merge); this
// project has neither, so this is the small honest equivalent — join
// the truthy class names. There are no Tailwind classes to
// intelligently merge, so there's nothing for the real version to do
// that this doesn't.
//
// It also stamps 'animated-icon' onto everything it touches, which is
// deliberate and worth explaining rather than looking like a mistake:
// each downloaded icon wraps its svg in a plain <div>, and a div is
// block-level, so outside a flex row it stretches full-width and
// pushes things around. Fixing that per-icon would mean editing every
// file, and re-running the CLI would silently undo it. Stamping the
// class here means one CSS rule in globals.css covers every icon
// already installed and every one added later, with no per-file edits
// to lose.
//
// Nothing else in the project uses cn, so this is safe. If something
// else ever does, split the stamping out of it.
export function cn(...classes) {
  return ['animated-icon', ...classes].filter(Boolean).join(' ')
}
