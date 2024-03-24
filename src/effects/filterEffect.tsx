import {LayerEffect} from '@/src/effects/types';

type FilterOptions = {
  filter: string;
};

export const filterEffect: LayerEffect<FilterOptions> = {
  apply({effectOptions, ctx}) {
    const {filter = ''} = effectOptions;
    ctx.save();
    ctx.filter = filter;
    return () => {
      ctx.restore();
    };
  },

  UIPanel({options, setOptions}) {
    return (
      <label>
        Filter
        <input
          type="text"
          value={options.filter}
          onChange={(e) => setOptions({...options, filter: e.target.value})}
        />
      </label>
    );
  },
};
