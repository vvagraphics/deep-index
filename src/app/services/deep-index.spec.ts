import { TestBed } from '@angular/core/testing';

import { DeepIndex } from './deep-index';

describe('DeepIndex', () => {
  let service: DeepIndex;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeepIndex);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
