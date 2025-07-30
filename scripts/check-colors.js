function checkColorContrast(foreground, background) {
  const getLuminance = (color) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const toLinear = (c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };

    const rLinear = toLinear(r);
    const gLinear = toLinear(g);
    const bLinear = toLinear(b);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  };

  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);

  const contrastRatio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                       (Math.min(fgLuminance, bgLuminance) + 0.05);

  return {
    ratio: Math.round(contrastRatio * 100) / 100,
    passesAA: contrastRatio >= 4.5,
    passesAALarge: contrastRatio >= 3.0,
    passesAAA: contrastRatio >= 7.0,
  };
}

console.log('Current Spotify Green (#1ed760) on white:');
console.log(checkColorContrast('#1ed760', '#ffffff'));

console.log('\nText green (#16a34a) on white:');
console.log(checkColorContrast('#16a34a', '#ffffff'));

console.log('\nGray text (#d1d5db) on white:');
console.log(checkColorContrast('#d1d5db', '#ffffff'));

console.log('\nWhite text on Spotify Green (#1ed760):');
console.log(checkColorContrast('#ffffff', '#1ed760'));

// Suggest better colors
console.log('\n--- Suggested Better Colors ---');
console.log('Darker green (#15803d) on white:');
console.log(checkColorContrast('#15803d', '#ffffff'));

console.log('\nEven darker green (#166534) on white:');
console.log(checkColorContrast('#166534', '#ffffff'));

console.log('\nDarker gray (#6b7280) on white:');
console.log(checkColorContrast('#6b7280', '#ffffff'));