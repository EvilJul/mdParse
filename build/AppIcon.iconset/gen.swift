import Cocoa

let size = CGSize(width: 1024, height: 1024)
let image = NSImage(size: size)
image.lockFocus()
let ctx = NSGraphicsContext.current!.cgContext

// Background squircle
let rect = CGRect(x: 0, y: 0, width: 1024, height: 1024)
let path = NSBezierPath(roundedRect: rect, xRadius: 224, yRadius: 224)
path.addClip()

// Deep indigo-blue gradient
let colors = [
    NSColor(red: 30/255.0, green: 58/255.0, blue: 95/255.0, alpha: 1).cgColor,
    NSColor(red: 15/255.0, green: 23/255.0, blue: 42/255.0, alpha: 1).cgColor
] as CFArray
let gradient = CGGradient(colorsSpace: nil, colors: colors, locations: [0, 1.0])
ctx.drawLinearGradient(gradient!, start: CGPoint(x: 0, y: 1024), end: CGPoint(x: 1024, y: 0), options: [])

// Simple document — no fold, no code block, clean
let docRect = CGRect(x: 312, y: 262, width: 400, height: 500)
let docPath = NSBezierPath(roundedRect: docRect, xRadius: 44, yRadius: 44)
NSColor.white.setFill()
docPath.fill()

// "#" mark in accent color
let accent = NSColor(red: 30/255.0, green: 58/255.0, blue: 95/255.0, alpha: 1)
let attrs: [NSAttributedString.Key: Any] = [
    .font: NSFont.boldSystemFont(ofSize: 200),
    .foregroundColor: accent
]
"#".draw(at: CGPoint(x: 412, y: 610), withAttributes: attrs)

// Clean horizontal lines
let lineColor = NSColor(red: 226/255.0, green: 232/255.0, blue: 240/255.0, alpha: 1)
lineColor.setFill()
CGRect(x: 412, y: 622, width: 220, height: 8).fill()
CGRect(x: 412, y: 678, width: 180, height: 3).fill()
CGRect(x: 412, y: 700, width: 220, height: 3).fill()
CGRect(x: 412, y: 722, width: 160, height: 3).fill()

// Bottom decorative text line
let textColor = NSColor(red: 200/255.0, green: 208/255.0, blue: 220/255.0, alpha: 1)
textColor.setFill()
CGRect(x: 372, y: 788, width: 280, height: 6).fill()
CGRect(x: 372, y: 808, width: 220, height: 6).fill()
CGRect(x: 372, y: 828, width: 250, height: 6).fill()

image.unlockFocus()

if let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) {
    let bitmap = NSBitmapImageRep(cgImage: cgImage)
    bitmap.size = size
    if let data = bitmap.representation(using: .png, properties: [:]) {
        try data.write(to: URL(fileURLWithPath: "/Volumes/DATA/mdParse/build/AppIcon.iconset/master.png"))
        print("OK")
    }
}
