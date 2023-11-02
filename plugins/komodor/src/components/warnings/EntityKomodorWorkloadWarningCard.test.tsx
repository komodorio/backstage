/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EntityKomodorWorkloadWarningCard } from './EntityKomodorWorkloadWarningCard';

describe('Show alert', () => {
  it('renders the user table', async () => {
    render(<EntityKomodorWorkloadWarningCard title="mock" message="message" />);

    // Wait for the table to render
    const table = await screen.findByRole('alert');

    // Assert that the table contains the expected user data
    expect(table).toBeInTheDocument();
  });
});
