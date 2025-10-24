import styles from './styles/example-island.module.css';

interface ExampleIslandProps {
  richText?: string;
  backgroundColor?: {
    color: string;
    opacity: number;
  };
  themePrimaryColor?: string;
}

export default function ExampleIsland({ richText, backgroundColor, themePrimaryColor }: ExampleIslandProps) {  
  const handleClick = () => {
    alert("React button clicked!");
    console.log("React interactivity works!");
  };

  // Parse themePrimary if it's a JSON string
  const parsedThemePrimaryColor = typeof themePrimaryColor === 'string' 
    ? JSON.parse(themePrimaryColor) 
    : themePrimaryColor;

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Function to determine background style using RGBA values
  const getBackgroundStyle = () => {
    // Use backgroundColor.color if it exists, otherwise use parsedThemePrimaryColor.css
    const colorValue = backgroundColor?.color || parsedThemePrimaryColor?.css;
    const opacity = backgroundColor?.opacity !== undefined ? backgroundColor.opacity / 100 : 1;
    
    if (!colorValue) return {};

    const rgb = hexToRgb(colorValue);

    return rgb ? {
      backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
    } : {
      backgroundColor: colorValue
    };
  };

  const backgroundStyle = getBackgroundStyle();    

  return (
    <div style={backgroundStyle} className={styles.exampleIsland}>
      <div dangerouslySetInnerHTML={{ __html: richText }} />
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}