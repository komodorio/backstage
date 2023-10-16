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
import { Alert } from '@material-ui/lab';
import { Box } from '@material-ui/core';

export interface WarningCardProps {
  title: string;
  message: string;
}

/**
 * A generic alert
 * @returns
 */
export function EntityKomodorServiceWarningCard({
  title,
  message,
}: WarningCardProps) {
  return (
    <Box mb={1}>
      <Alert severity="warning">
        <div>{title}</div>
        <div>{message}</div>
      </Alert>
    </Box>
  );
}
