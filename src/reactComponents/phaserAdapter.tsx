import React, { useLayoutEffect } from 'react';
import styled from 'styled-components';

/**
 * Config that excludes properties that the adapter will automatically handle for us
 */
export type ModifiedGameConfig = Omit<Phaser.Types.Core.GameConfig, 'parent'|'height'|'width'>;

const mergeGameConfig = (config: ModifiedGameConfig, parent: HTMLDivElement): Phaser.Types.Core.GameConfig => {
  const result: Phaser.Types.Core.GameConfig = {
    ...config,
    parent,
  };
  return result;
};

const ContainerDiv = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
`;

export const PhaserAdapter = ({config}: {config: ModifiedGameConfig}) => {
  const container = React.useRef<HTMLDivElement>(null);
 
  useLayoutEffect(() => {
    if (container?.current) {
      (window as any)._game = new Phaser.Game(mergeGameConfig(config, container.current));
    }

    return () => {
      ((window as any)._game as Phaser.Game | undefined)?.destroy(true);
    }
  }, [container]);

  return <ContainerDiv ref={container}/>;
}