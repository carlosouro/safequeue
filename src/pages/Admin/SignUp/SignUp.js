import React, { useState, useEffect } from 'react'
import { TextField } from '@material-ui/core'
import { Alert } from '@material-ui/lab'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import SignUpBg from '../../../assets/bg/main.svg'
import Layout from '../Layout'
import Button from '../../../components/Button'
import Loader from '../../../components/Loader'
import { PRIMARY_COLOR, SECONDARY_COLOR } from '../../../constants/ColorConstants'
import authentication from '../../../services/authentication'
import { auth } from '../../../firebase'

import SuccessfulSignUp from './SuccessfulSignUp'

const Form = styled.form`
  padding: 0 30px;

  .MuiInput-root {
    margin-bottom: 2em;
  }

  button {
    margin-top: 2em;
  }

  .MuiTextField-root {
    border-color: ${PRIMARY_COLOR} !important;

    label {
      color: ${PRIMARY_COLOR} !important;
    }

    .MuiInput-root {
      &:before {
        border-color: ${SECONDARY_COLOR} !important;
      }

      &:after {
        border-color: ${PRIMARY_COLOR} !important;
      }
    }
  }

  .MuiAlert-root {
    text-align: left;
  }

  input {
    width: 100%;
  }
`
const inputProps = {
  fullWidth: true,
  required: true,
}

function SignUp() {
  const { t } = useTranslation()
  const [fields, setFields] = useState()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState()
  const [success, setSuccess] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const mappedMessages = {
    'auth/weak-password': t('admin#signup_weakPassword'),
    'auth/email-already-in-use': t('admin#signup_emailInUse'),
    'auth/invalid-email': t('admin#signup_invalidEmail'),
    'auth/operation-not-allowed': t('admin#signup_operationNotAllowed'),
  }

  const handleChange = ({ target: { name, value } }) => {
    setFields({
      ...fields,
      [name]: value
    })
  }
  const handleSubmit = e => {
    e.preventDefault()
    setError()
    setLoading(true)
    setNeedsVerification(false)

    const { email, password } = fields

    authentication
      .signUpWithEmailAddressAndPassword(email, password)
      .then(() => {
        setSuccess(true)
        setLoading(false)
      })
      .catch(error => {
        setLoading(false)
        error && setError(mappedMessages[error.code])
      })
  }

  useEffect(() => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      setNeedsVerification(true)
    }
  }, [])

  if (loading) return <Loader />
  if (success) return <SuccessfulSignUp />

  return (
    <Layout bg={SignUpBg}>
      <Form onSubmit={handleSubmit}>
        <TextField
          label={t('admin#signup_emailLabel')}
          name="email"
          onChange={e => handleChange(e)}
          {...inputProps}
        />

        <TextField
          label={t('admin#signup_passwordLabel')}
          type="password"
          name="password"
          onChange={e => handleChange(e)}
          min="6"
          {...inputProps}
        />

        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        {needsVerification && (
          <Alert severity="info">
            {t('admin#signup_checkYourEmail')}
          </Alert>
        )}

        <Button type="submit" forward>
          {t('admin#signup_register')}
        </Button>
      </Form>
    </Layout>
  )
}

export default SignUp
