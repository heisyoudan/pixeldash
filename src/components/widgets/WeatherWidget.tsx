import React, { useEffect, useState, useRef } from 'react';
import { PixelWeatherIcon } from '@/components/ui/PixelWeatherIcon';
import { convertTemp, TempUnit } from '@/utils/weatherUtils';
import { useWeather } from '@/hooks/useWeather';

interface WeatherWidgetProps {
  mode?: 'standard' | 'icon';
  unit?: TempUnit;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ mode = 'standard', unit = 'C' }) => {
  const { data, loading, error, refetch } = useWeather();

  // Responsive Logic for Standard Mode
  const containerRef = useRef<HTMLDivElement>(null);
  const [showForecast, setShowForecast] = useState(true);

  // Resize Observer for Standard Mode
  useEffect(() => {
    if (!containerRef.current || mode === 'icon') return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        setShowForecast(entry.contentRect.height >= 160);
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [mode]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-[var(--color-muted)] select-none">
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-[var(--color-muted)] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 bg-[var(--color-muted)] rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1.5 h-1.5 bg-[var(--color-muted)] rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="text-xs font-mono opacity-50">loading..</span>
      </div>
    );
  }

  if (error || !data) {
    const isTimeout = error?.toLowerCase().includes("timed out");
    const isPermission = error?.toLowerCase().includes("denied") || error?.toLowerCase().includes("permission");

    let errorText = error || 'no data';
    if (isTimeout) errorText = "Request Timed Out";

    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-[var(--color-muted)] select-none px-4">
        <span className="text-sm font-mono text-[var(--color-accent)]">⚠</span>
        <span className="text-xs font-mono opacity-70 text-center">{errorText}</span>

        {isPermission && (
          <span className="text-[10px] font-mono opacity-40">check location permissions</span>
        )}

        <button
          onClick={refetch}
          className="text-[10px] border border-[var(--color-border)] px-2 py-1 rounded hover:bg-[var(--color-bg-secondary)] transition-colors opacity-60 hover:opacity-100 mt-2"
        >
          retry
        </button>
      </div>
    );
  }

  // --- Icon Mode Render ---
  // Normalize location display to prefer city name only
  const getCityDisplay = (name?: string) => {
    if (!name) return '';
    const coordRe = /^\s*-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?\s*$/;
    if (coordRe.test(name)) return '';
    const parts = name.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    const last = parts[parts.length - 1];
    // If last part is short (e.g. country code / state like 'CA'), prefer the first part
    if (last.length <= 3) return parts[0];
    return last;
  };

  if (mode === 'icon') {
    return (
      <div ref={containerRef} className="h-full w-full select-none overflow-hidden bg-[var(--color-bg)] p-4">
        <div className="grid grid-cols-2 grid-rows-[auto_1fr_auto_auto_auto] gap-2 h-full w-full">

          {/* Row 1: City Name & Temp Side by Side */}
          <div className="col-span-1 flex items-center justify-start">
            <span className="text-[var(--color-fg)] font-bold text-lg tracking-tight truncate" title={data.locationName}>
              {getCityDisplay(data.locationName)}
            </span>
          </div>

          <div className="col-span-1 flex items-center justify-end">
            <div className="text-[var(--color-fg)] font-bold text-3xl leading-none">
              {convertTemp(data.current.temp, unit)}°{unit}
            </div>
          </div>

          {/* Row 2: Large Pixel Icon */}
          <div className="col-span-2 flex items-center justify-center flex-1 w-full">
            <PixelWeatherIcon code={data.current.weatherCode} size={10} />
          </div>

          {/* Row 3: Weather Condition */}
          <div className="col-span-2 flex items-center justify-center">
            <span className="text-[var(--color-fg)] text-base font-medium opacity-90 capitalize">
              {data.current.condition}
            </span>
          </div>

          {/* Row 4: Weather Details (Data) */}
          <div className="col-span-2 flex font-mono text-xs gap-4 text-[var(--color-muted)] justify-start px-1">
            <div className="flex flex-col gap-0.5">
              <span className="uppercase tracking-widest opacity-70">humi</span>
              <span className="tabular-nums font-bold text-[var(--color-fg)]">{data.current.humidity}%</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="uppercase tracking-widest opacity-70">wind</span>
              <span className="tabular-nums font-bold text-[var(--color-fg)]">{data.current.windSpeed} mph</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="uppercase tracking-widest opacity-70">prec</span>
              <span className="tabular-nums font-bold text-[var(--color-fg)]">{data.current.precipAmt || 0}mm</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="uppercase tracking-widest opacity-70">feel</span>
              <span className="tabular-nums font-bold text-[var(--color-fg)]">{convertTemp(data.current.feelsLike, unit)}°</span>
            </div>
          </div>

          {/* White Box: Hourly Forecast */}
          <div className="col-span-2 flex items-center justify-between border-t border-[var(--color-border)] pt-2 mt-1">
            {data.forecast.slice(0, 3).map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 w-1/3 text-[var(--color-fg)]">
                <span className="text-[10px] font-mono opacity-50">{item.time}</span>
                <span className="text-sm font-bold">{convertTemp(item.temp, unit)}°</span>
                {/* Small icon for forecast */}
                <div className="opacity-100">
                  <PixelWeatherIcon code={item.weatherCode || 0} size={4} />
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  // --- Standard Mode Render ---
  return (
    <div ref={containerRef} className="h-full flex flex-col p-3 select-none overflow-hidden" style={{ fontFamily: 'inherit' }}>


      {/* Top: Temperature left, Location + Condition right */}
      <div className="flex-shrink-0 mb-4 flex items-stretch gap-3">
        {/* Left: big temp */}
        <div className="text-5xl font-light text-[var(--color-fg)] leading-none self-center whitespace-nowrap">
          {convertTemp(data.current.temp, unit)}°
        </div>
        {/* Divider */}
        <div className="w-px bg-[var(--color-border)] opacity-40 self-stretch flex-shrink-0" />
        {/* Right: location (top) + condition (bottom), fills same height as temp */}
        <div className="flex flex-col justify-between min-w-0 py-0.5">
          <div className="text-[var(--color-fg)] font-mono text-sm truncate leading-tight">
            {getCityDisplay(data.locationName)}
          </div>
          <div className="text-[var(--color-muted)] text-sm lowercase leading-tight truncate">
            {data.current.condition}
          </div>
        </div>
      </div>

      {/* Bottom: Left = Icon, Right = Stats */}
      <div className="flex-1 flex gap-3 min-h-0">

        {/* Bottom Left: Pixel Icon */}
        <div className="flex-1 flex items-center justify-center min-h-0 min-w-0">
          <PixelWeatherIcon code={data.current.weatherCode} size={7} />
        </div>

        {/* Bottom Right: 4 Stats */}
        <div className="flex-shrink-0 flex flex-col justify-center gap-1.5 text-xs font-mono text-[var(--color-muted)] mr-4">
          <div className="flex items-center gap-3">
            <span className="w-7">humi</span>
            <span className="text-[var(--color-fg)] font-bold">{data.current.humidity}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-7">wind</span>
            <span className="text-[var(--color-fg)] font-bold">{data.current.windSpeed} mph</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-7">prec</span>
            <span className="text-[var(--color-fg)] font-bold">{data.current.precipProb}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-7">feel</span>
            <span className="text-[var(--color-fg)] font-bold">{convertTemp(data.current.feelsLike, unit)}°</span>
          </div>
        </div>

      </div>

      {/* Hourly Forecast — horizontal, 4 items fill width */}
      {showForecast && data.forecast.length > 0 && (
        <div className="flex-shrink-0 flex flex-row items-end gap-2 border-t border-[var(--color-border)] border-opacity-30 pt-2">
          {data.forecast.slice(0, 4).map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-2 text-xs font-mono flex-1">
              <span className="text-[var(--color-muted)] opacity-70">{f.time}</span>
              <span className="text-[var(--color-fg)] font-bold">{convertTemp(f.temp, unit)}°</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
