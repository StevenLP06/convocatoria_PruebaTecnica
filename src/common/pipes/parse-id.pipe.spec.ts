import { BadRequestException } from '@nestjs/common';
import { ParseIdPipe } from './parse-id.pipe';

describe('ParseIdPipe', () => {
  const pipe = new ParseIdPipe();

  it.each([
    ['1', 1],
    ['42', 42],
    ['2147483647', 2147483647],
  ])('convierte "%s" en %d', (input, expected) => {
    expect(pipe.transform(input)).toBe(expected);
  });

  it.each(['0', '-1', '1.5', 'abc', '', '2147483648', '1e3', ' 7'])('rechaza "%s"', (input) => {
    expect(() => pipe.transform(input)).toThrow(BadRequestException);
  });
});
