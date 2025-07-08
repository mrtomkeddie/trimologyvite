import { Toaster } from "@/components/ui/toaster"
import './globals.css';

// The 'metadata' export has been removed to allow for full manual control in the <head> tag.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Trimology</title>
        <meta name="description" content="Book your next appointment with Trimology." />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
        
        <meta name="theme-color" content="#E3B7A1" />
        <link rel="icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB+klEQVR42mP8//8/AwyMjIwcjI4eAASIIZgYGBgZeXn+3y/l/H8O2Q9AwQyMDIyMzAybGFi4ubjw/1fL9n8G9/4/BvL/M7jP8+//f4Zf/P4/4//z5/+PIV/++x/n//vP/w/i/zP4z/Cf/z+GZAIowPD/P1/+Vsr/b2XP/2/l//+yF//fKvl/gKIZGBgYGVgZmAEFzPD//2/mP/7/L/35/z/l0/+Vyv9/haL/C0T/F4r+LxT/Xyn/v1jy/s/AxsDKwMTMxMrAwsDGwMzMyMDIwMjAHIICpCBmYGFgYWBhYGJgZWAGmYGBg4sDw/8/w/+/f/L/ExMT/39w8v8//w8D+/vf/38w+P/v/7//D/7/B/P9/vf//w+29/v/f2DY/3eA48P/P4M/fP0/JP/58z/C/+ef/x/C/2fwX/Cf/z8G+v4Dwf3//z8Gfvz/f+z9/v/r0vY/wz98/T/M//ef/x/C/mfwn+E/w3+G/wz/2f/v/2/f//9+e/j/9t79f/nO/T/9ufN/8ubO/1S3Z//vOPv/Nmvb/86tof+b2Ln/r2di/6+VmP//Xl7///Hx/f8PDw+lAQIIMAAYshkYGBgZ8KYwMzIysDIwMDAyMDIwsHP475/hP3/+5P9nsPf/X/r//3/6/v9/evf/P33s/z9z5v8/f+z+P3Xu/T954+Z/Vs2d/12aV/+7NK//dyyn/ncoZ//HIuU/jBzyPwby/8cY/P8PFPgfBvL/Fxb5HwL5//4w/D/w3/+Pwf8/QPwPDPr+A8H/P0Dgf1jQ/z+s8f8/rPP/P6zx/D/M+fw/zPj8P8z49D/M9/E/DPfxPwz39z8M9+k/DPfpPwwA0jO/p0rLMAAAAABJRU5kJggg==" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
